// /app/api/onboarding/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  addConsent,
  createUser,
  setKycStatus,
  setStatus,
  setFeatures,
} from "@/actions/user.actions";

export const runtime = "nodejs";

function generateWalletFor(clerkId: string): string {
  return `pda_${Buffer.from(clerkId).toString("hex").slice(0, 32)}`;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const data = (await req.json()) as {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    walletAddress?: string;
    countryISO: string;
    displayCurrency?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      stateOrProvince: string;
      postalCode: string;
      country: string;
    };
    dob?: string | Date;
    phoneNumber?: string;
    riskLevel?: "low" | "medium" | "high";
    consents?: Array<{ type: "tos" | "privacy" | "risk"; version: string }>;
  };

  if (data.clerkId !== userId)
    return new NextResponse("Clerk user mismatch", { status: 403 });

  // Minimal checks (name/email come from Clerk; you keep just mailing info etc.)
  if (!data.email) return new NextResponse("Missing email", { status: 400 });
  if (!data.countryISO)
    return new NextResponse("Missing countryISO", { status: 400 });
  if (
    !data.address?.line1 ||
    !data.address?.city ||
    !data.address?.stateOrProvince ||
    !data.address?.postalCode ||
    !data.address?.country
  ) {
    return new NextResponse("Incomplete address", { status: 400 });
  }

  const walletAddress = data.walletAddress || generateWalletFor(data.clerkId);
  const dobDate = data.dob ? new Date(data.dob) : undefined;

  // Create (idempotent) user
  const user = await createUser({
    clerkId: data.clerkId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    walletAddress,
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

  // Save consents
  if (Array.isArray(data.consents)) {
    for (const c of data.consents) {
      await addConsent(user.clerkId, { type: c.type, version: c.version });
    }
  }

  // ✅ Treat onboarding success as "approved" for your app
  await setKycStatus(user.clerkId, "approved");
  await setStatus(user.clerkId, "active");

  // Optional: turn on specific features immediately
  await setFeatures(user.clerkId, { onramp: true }); // cards/lend can stay false until ready

  return NextResponse.json({ ok: true });
}
