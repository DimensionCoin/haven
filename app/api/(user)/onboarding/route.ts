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
import User from "@/modals/user.modal";
import { connect } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AddressInput = {
  line1: string;
  line2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
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
  return (
    !!o &&
    typeof o.line1 === "string" &&
    typeof o.city === "string" &&
    typeof o.stateOrProvince === "string" &&
    typeof o.postalCode === "string" &&
    typeof o.country === "string"
  );
}

function log(
  traceId: string,
  msg: string,
  extra: Record<string, unknown> = {}
) {
  console.log(`[onboarding][${traceId}] ${msg}`, extra);
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  const traceId =
    req.headers.get("x-request-id") ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  log(traceId, "init", {
    nodeEnv: process.env.NODE_ENV || "development",
    hasPrivyAppId: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    hasPrivySecret: !!(
      process.env.PRIVY_SECRET_KEY || process.env.PRIVY_API_KEY
    ),
    hasMongoUrl: !!process.env.MONGODB_URL,
  });

  // 0) DB connect first
  try {
    await connect();
    log(traceId, "db connected");
  } catch (e) {
    log(traceId, "db connect failed", { error: String(e) });
    return new NextResponse("Database connection failed", { status: 500 });
  }

  // 1) Auth
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.userId ?? null;
  } catch (e) {
    log(traceId, "auth() threw", { error: String(e) });
  }
  if (!userId) {
    log(traceId, "unauthorized (no Clerk user)");
    return new NextResponse("Unauthorized", { status: 401 });
  }
  log(traceId, "auth ok", { clerkUserId: userId });

  // 2) Parse & validate payload
  let data: Payload;
  try {
    const raw = await req.json();
    const echo = JSON.parse(JSON.stringify(raw));
    if (typeof echo?.email === "string") echo.email = echo.email.slice(0, 80);
    if (typeof echo?.phoneNumber === "string")
      echo.phoneNumber = echo.phoneNumber.slice(0, 40);
    log(traceId, "payload received", { echo });
    data = raw as Payload;
  } catch (e) {
    log(traceId, "invalid json", { error: String(e) });
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!data?.clerkId || data.clerkId !== userId) {
    log(traceId, "clerk mismatch", { payloadClerkId: data?.clerkId, userId });
    return new NextResponse("Clerk user mismatch", { status: 403 });
  }
  if (!data.email || typeof data.email !== "string") {
    log(traceId, "missing email");
    return new NextResponse("Missing email", { status: 400 });
  }
  if (!data.countryISO || typeof data.countryISO !== "string") {
    log(traceId, "missing countryISO");
    return new NextResponse("Missing countryISO", { status: 400 });
  }
  if (!hasAddress(data.address)) {
    log(traceId, "incomplete address");
    return new NextResponse("Incomplete address", { status: 400 });
  }

  try {
    // 3) Wallet ensure/reuse
    log(traceId, "wallet phase start");
    const existing = await User.findOne(
      { clerkId: data.clerkId },
      "walletAddress walletId email"
    ).lean();

    log(traceId, "existing user lookup done", {
      found: !!existing,
      existingWalletAddress: existing?.walletAddress,
      existingWalletId: existing?.walletId,
    });

    let walletAddress: string;
    let walletId: string | undefined;

    if (existing?.walletAddress) {
      walletAddress = existing.walletAddress;
      walletId = existing.walletId ?? undefined;
      log(traceId, "reuse wallet from db", { walletAddress, walletId });
    } else {
      log(traceId, "calling ensurePrivyEmbeddedWallet");
      const ensured = await ensurePrivyEmbeddedWallet({
        externalUserId: data.clerkId,
        chain: "solana",
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      walletAddress = ensured?.address as string;
      walletId = ensured?.walletId ?? undefined;

      log(traceId, "ensurePrivyEmbeddedWallet ok", {
        ensuredAddress: walletAddress,
        ensuredWalletId: walletId,
      });

      if (!walletAddress) {
        log(traceId, "walletAddress missing after ensurePrivyEmbeddedWallet!");
        return new NextResponse(
          "Privy wallet provisioning failed (no address)",
          { status: 502 }
        );
      }
    }

    // 4) Create (or return) user
    const dobDate = data.dob ? new Date(data.dob) : undefined;
    log(traceId, "createUser start", {
      clerkId: data.clerkId,
      email: data.email,
      walletAddress,
      hasWalletId: !!walletId,
    });

    const user = await createUser({
      clerkId: data.clerkId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      walletAddress,
      walletId,
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

    // Avoid `any`: don’t log raw _id, or stringify safely
    log(traceId, "createUser ok", {
      clerkId: user.clerkId,
      hasWalletId: !!user.walletId,
    });

    if (!user.walletId && walletId) {
      const upd = await User.updateOne(
        { clerkId: user.clerkId },
        { $set: { walletId } }
      );
      log(traceId, "backfill walletId result", {
        matchedCount: upd.matchedCount,
        modifiedCount: upd.modifiedCount,
        acknowledged: upd.acknowledged,
      });
    }

    await setKycStatus(user.clerkId, "approved");
    await setStatus(user.clerkId, "active");
    await setFeatures(user.clerkId, { onramp: true });
    log(traceId, "post-create status set");

    if (Array.isArray(data.consents)) {
      for (const c of data.consents) {
        try {
          await addConsent(user.clerkId, { type: c.type, version: c.version });
          log(traceId, "consent added", { type: c.type, version: c.version });
        } catch (e) {
          log(traceId, "consent add failed (continuing)", {
            type: c.type,
            version: c.version,
            error: String(e),
          });
        }
      }
    }

    log(traceId, "success", { totalMs: Date.now() - startedAt });
    return NextResponse.json({
      ok: true,
      traceId,
      user: {
        clerkId: user.clerkId,
        walletAddress,
        walletId,
        kycStatus: "approved",
        status: "active",
        features: { onramp: true, cards: false, lend: false },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;

    if (err instanceof ConflictError) {
      log(traceId, "ConflictError", { message });
      return new NextResponse(message, { status: 409 });
    }
    if (err instanceof ValidationError) {
      log(traceId, "ValidationError", { message });
      return new NextResponse(message, { status: 400 });
    }

    log(traceId, "Unhandled error", { message, stack });
    if ((process.env.NODE_ENV || "development") !== "production") {
      return new NextResponse(message || "Internal error", { status: 500 });
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
