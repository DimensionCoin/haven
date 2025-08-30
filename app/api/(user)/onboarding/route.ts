// app/api/onboarding/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  addConsent,
  createUser,
  setKycStatus,
  setStatus,
  setFeatures,
  ConflictError,
  ValidationError,
} from "@/actions/user.actions";
import { ensurePrivyEmbeddedWallet } from "@/lib/privy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AddressInput = {
  line1: string;
  line2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string; // ISO-3166 alpha-2
};

type Payload = {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  countryISO: string;
  displayCurrency?: string;
  address: AddressInput;
  dob?: string | Date;
  phoneNumber?: string;
  riskLevel?: "low" | "medium" | "high";
  consents?: Array<{ type: "tos" | "privacy" | "risk"; version: string }>;
};

function hasAddress(a: unknown): a is AddressInput {
  const o = a as AddressInput;
  return !!(
    o &&
    typeof o.line1 === "string" &&
    typeof o.city === "string" &&
    typeof o.stateOrProvince === "string" &&
    typeof o.postalCode === "string" &&
    typeof o.country === "string"
  );
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.userId;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  let data: Payload;
  try {
    data = (await req.json()) as Payload;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!data?.clerkId || data.clerkId !== userId)
    return new NextResponse("Clerk user mismatch", { status: 403 });
  if (!data.email || typeof data.email !== "string")
    return new NextResponse("Missing email", { status: 400 });
  if (!data.countryISO || typeof data.countryISO !== "string")
    return new NextResponse("Missing countryISO", { status: 400 });
  if (!hasAddress(data.address))
    return new NextResponse("Incomplete address", { status: 400 });

  try {
    // 1) Create/fetch Privy embedded wallet (Solana)
    //    NOTE: ensurePrivyEmbeddedWallet should return BOTH address & walletId
    const { address: walletAddress, walletId } =
      await ensurePrivyEmbeddedWallet({
        externalUserId: data.clerkId,
        chain: "solana",
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      });

    // 2) Create user (idempotent)
    const dobDate = data.dob ? new Date(data.dob) : undefined;

    const user = await createUser({
      clerkId: data.clerkId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      walletAddress, // public key
      walletId, // <-- persist Privy wallet id
      countryISO: data.countryISO.toUpperCase(),
      displayCurrency: (data.displayCurrency ?? "").toUpperCase() || undefined,
      address: {
        line1: data.address.line1,
        line2: data.address.line2 || "",
        city: data.address.city,
        stateOrProvince: data.address.stateOrProvince,
        postalCode: data.address.postalCode,
        country: data.address.country.toUpperCase(),
      },
      dob: dobDate,
      phoneNumber: data.phoneNumber,
      riskLevel: data.riskLevel ?? "low",
    });

    // 3) Approve KYC, activate account, enable onramp
    await setKycStatus(user.clerkId, "approved");
    await setStatus(user.clerkId, "active");
    await setFeatures(user.clerkId, { onramp: true });

    // 4) Record consents (best-effort)
    if (Array.isArray(data.consents)) {
      for (const c of data.consents) {
        await addConsent(user.clerkId, { type: c.type, version: c.version });
      }
    }

    return NextResponse.json({
      ok: true,
      user: {
        clerkId: user.clerkId,
        walletAddress,
        walletId, // <-- return if you want it on the client
        kycStatus: "approved",
        status: "active",
        features: { onramp: true, cards: false, lend: false },
      },
    });
  } catch (err: unknown) {
    if (err instanceof ConflictError)
      return new NextResponse(err.message, { status: 409 });
    if (err instanceof ValidationError)
      return new NextResponse(err.message, { status: 400 });

    console.error("Onboarding error:", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
