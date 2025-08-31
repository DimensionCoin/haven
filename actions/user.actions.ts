// /actions/user.actions.ts
import mongoose from "mongoose";
import { connect } from "@/db";
import User, { IUser } from "@/modals/user.modal";

// ---------- Error helpers ----------
export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
export class ConflictError extends Error {
  constructor(message = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}
export class ValidationError extends Error {
  constructor(message = "Validation error") {
    super(message);
    this.name = "ValidationError";
  }
}

// ---------- Util ----------
const toIUser = (doc: any): IUser =>
  (doc?.toObject ? doc.toObject() : doc) as IUser;

const isDupErr = (e: any) => e && e.code === 11000;

// ---------- Input types ----------
export type AddressInput = {
  line1: string;
  line2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string; // ISO-3166 alpha-2
};

export type CreateUserInput = {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  walletAddress: string; // Privy public key
  walletId?: string; // Privy wallet id
  countryISO: string; // ISO-3166 alpha-2
  displayCurrency?: string; // ISO-4217
  address: AddressInput;
  dob?: Date;
  phoneNumber?: string;
  features?: Partial<IUser["features"]>;
  riskLevel?: IUser["riskLevel"];
  status?: IUser["status"];
};

export type UpdateUserInput = Partial<
  Omit<CreateUserInput, "clerkId" | "walletAddress" | "walletId">
> & { email?: string };

type FeaturePatch = Partial<Record<"onramp" | "cards" | "lend", boolean>>;

// ---------- CRUD & helpers ----------

export async function createUser(input: CreateUserInput): Promise<IUser> {
  await connect();

  // Idempotent by clerkId
  const existingByClerk: IUser | null = await User.findOne({
    clerkId: input.clerkId,
  }).lean<IUser>();

  if (existingByClerk) {
    // ✅ If the doc exists but is missing walletId, backfill it
    if (input.walletId && !existingByClerk.walletId) {
      await User.updateOne(
        { clerkId: input.clerkId },
        { $set: { walletId: input.walletId } }
      );
      const refreshed = await User.findOne({ clerkId: input.clerkId }).lean<IUser>();
      return refreshed as IUser;
    }
    return existingByClerk;
  }

  const normalizedEmail = input.email.toLowerCase().trim();

  // Uniqueness checks
  const [emailTaken, walletTaken] = await Promise.all([
    User.exists({ email: normalizedEmail }),
    User.exists({ walletAddress: input.walletAddress }),
  ]);
  if (emailTaken) throw new ConflictError("Email is already registered to another user.");
  if (walletTaken) throw new ConflictError("Wallet address is already linked to another user.");

  const created = await User.create({
    clerkId: input.clerkId,
    email: normalizedEmail,
    firstName: input.firstName,
    lastName: input.lastName,
    walletAddress: input.walletAddress,
    walletId: input.walletId, // <-- ensure we persist it
    countryISO: input.countryISO,
    displayCurrency: input.displayCurrency,
    address: input.address,
    dob: input.dob,
    phoneNumber: input.phoneNumber,
    features: input.features,
    riskLevel: input.riskLevel,
    status: input.status,
  });
  return toIUser(created);
}

// ---------- Reads ----------

export async function getUserByClerkId(clerkId: string): Promise<IUser> {
  await connect();
  const doc: IUser | null = await User.findOne({ clerkId }).lean<IUser>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}

export async function getUserPrivateByClerkId(clerkId: string): Promise<IUser> {
  await connect();
  const doc: IUser | null = await User.findOne({ clerkId })
    .select("+address +dob +phoneNumber")
    .lean<IUser>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}

export async function getUserById(userId: string): Promise<IUser> {
  await connect();
  if (!mongoose.isValidObjectId(userId))
    throw new ValidationError("Invalid user id");
  const doc: IUser | null = await User.findById(userId).lean<IUser>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}

export async function getUserByEmail(email: string): Promise<IUser> {
  await connect();
  const doc: IUser | null = await User.findOne({
    email: email.toLowerCase().trim(),
  }).lean<IUser>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}

// ---------- Update (general patch) ----------

export async function addConsent(
  clerkId: string,
  consent: { type: string; version: string; acceptedAt?: Date }
) {
  await connect();
  const doc = await User.findOneAndUpdate(
    { clerkId },
    {
      $push: {
        consents: {
          type: consent.type,
          version: consent.version,
          acceptedAt: consent.acceptedAt ?? new Date(),
        },
      },
    },
    { new: true }
  ).lean<IUser>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}


export async function updateUser(
  where: { clerkId?: string; userId?: string },
  updates: UpdateUserInput
): Promise<IUser> {
  await connect();

  const query: any = where.clerkId
    ? { clerkId: where.clerkId }
    : { _id: where.userId };
  if (!query.clerkId && !query._id)
    throw new ValidationError("Provide clerkId or userId");

  const $set: Record<string, any> = {};
  if (updates.firstName !== undefined) $set.firstName = updates.firstName;
  if (updates.lastName !== undefined) $set.lastName = updates.lastName;
  if (updates.displayCurrency !== undefined)
    $set.displayCurrency = updates.displayCurrency;
  if (updates.countryISO !== undefined) $set.countryISO = updates.countryISO;
  if (updates.address !== undefined) $set.address = updates.address;
  if (updates.dob !== undefined) $set.dob = updates.dob;
  if (updates.phoneNumber !== undefined) $set.phoneNumber = updates.phoneNumber;
  if (updates.riskLevel !== undefined) {
    $set.riskLevel = updates.riskLevel;
    $set.riskLevelUpdatedAt = new Date();
  }
  if (updates.status !== undefined) $set.status = updates.status;
  if (updates.email !== undefined)
    $set.email = updates.email.toLowerCase().trim();

  // features dot-patch
  if (updates.features !== undefined) {
    for (const [k, v] of Object.entries(
      (updates.features ?? {}) as FeaturePatch
    )) {
      if (typeof v === "boolean") $set[`features.${k}`] = v;
    }
  }

  if (Object.keys($set).length === 0) {
    const existing: IUser | null = await User.findOne(query).lean<IUser>();
    if (!existing) throw new NotFoundError("User not found");
    return existing;
  }

  const updated: IUser | null = await User.findOneAndUpdate(
    query,
    { $set },
    { new: true, runValidators: true }
  ).lean<IUser>();

  if (!updated) throw new NotFoundError("User not found");
  return updated;
}

// ---------- Specific setters (safer than generic) ----------

export async function setKycStatus(
  clerkId: string,
  kycStatus: IUser["kycStatus"]
): Promise<IUser> {
  await connect();
  const doc: IUser | null = await User.findOneAndUpdate(
    { clerkId },
    { $set: { kycStatus } },
    { new: true, runValidators: true }
  ).lean<IUser>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}

export async function setRiskLevel(
  clerkId: string,
  riskLevel: IUser["riskLevel"]
): Promise<IUser> {
  await connect();
  const doc: IUser | null = await User.findOneAndUpdate(
    { clerkId },
    { $set: { riskLevel, riskLevelUpdatedAt: new Date() } },
    { new: true, runValidators: true }
  ).lean<IUser>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}

export async function setFeatures(
  clerkId: string,
  features: FeaturePatch
): Promise<IUser> {
  await connect();
  const set: Record<string, boolean> = {};
  for (const [key, val] of Object.entries(features ?? {})) {
    if (typeof val === "boolean") set[`features.${key}`] = val;
  }

  if (Object.keys(set).length === 0) {
    const existing: IUser | null = await User.findOne({
      clerkId,
    }).lean<IUser>();
    if (!existing) throw new NotFoundError("User not found");
    return existing;
  }

  const doc: IUser | null = await User.findOneAndUpdate(
    { clerkId },
    { $set: set },
    { new: true, runValidators: true }
  ).lean<IUser>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}

export async function setStatus(
  clerkId: string,
  status: IUser["status"]
): Promise<IUser> {
  await connect();
  const doc: IUser | null = await User.findOneAndUpdate(
    { clerkId },
    { $set: { status } },
    { new: true, runValidators: true }
  ).lean<IUser>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}

/** Optional: backfill helper to set walletId / walletAddress after creation */
export async function setWalletInfo(
  clerkId: string,
  info: { walletId?: string; walletAddress?: string }
): Promise<IUser> {
  await connect();
  const $set: Record<string, any> = {};
  if (info.walletId) $set.walletId = info.walletId;
  if (info.walletAddress) $set.walletAddress = info.walletAddress;

  if (Object.keys($set).length === 0)
    throw new ValidationError("Nothing to update");

  const doc: IUser | null = await User.findOneAndUpdate(
    { clerkId },
    { $set },
    { new: true, runValidators: true }
  ).lean<IUser>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}

// ---------- List / pagination ----------

export async function listUsers(params?: {
  page?: number;
  pageSize?: number;
  kycStatus?: IUser["kycStatus"];
  status?: IUser["status"];
  countryISO?: string;
}) {
  await connect();

  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 20));
  const filter: any = {};
  if (params?.kycStatus) filter.kycStatus = params.kycStatus;
  if (params?.status) filter.status = params.status;
  if (params?.countryISO) filter.countryISO = params.countryISO.toUpperCase();

  const items: IUser[] = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean<IUser[]>()
    .exec();

  const total: number = await User.countDocuments(filter);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ---------- Soft delete ----------
export async function softDeleteUser(clerkId: string): Promise<IUser> {
  await connect();
  const doc: IUser | null = await User.findOneAndUpdate(
    { clerkId },
    { $set: { status: "blocked" } },
    { new: true, runValidators: true }
  ).lean<IUser>();
  if (!doc) throw new NotFoundError("User not found");
  return doc;
}
