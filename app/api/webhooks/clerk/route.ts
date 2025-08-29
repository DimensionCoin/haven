// /app/api/webhooks/clerk/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { updateUser, setStatus, NotFoundError } from "@/actions/user.actions";

// If you use the app router, keep this dynamic
export const dynamic = "force-dynamic";

// ---- Types to avoid `any` on Clerk payloads ----
type ClerkEmailEntry = { id: string; email_address: string };
interface ClerkUserData {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_addresses?: ClerkEmailEntry[];
  primary_email_address_id?: string | null;
}

// ---- Helpers ----
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const WEBHOOK_SECRET = requireEnv("WEBHOOK_SECRET");

function isUserEvent(
  e: WebhookEvent
): e is WebhookEvent & { data: ClerkUserData } {
  return typeof e?.type === "string" && e.type.startsWith("user.");
}

function getPrimaryEmail(data: ClerkUserData): string | undefined {
  const emails = data.email_addresses ?? [];
  const primaryId = data.primary_email_address_id ?? null;
  const primary = emails.find((x) => x.id === primaryId);
  const chosen = (primary?.email_address ?? emails[0]?.email_address)
    ?.toLowerCase()
    .trim();
  return chosen || undefined;
}

export async function POST(req: Request) {
  // 1) Verify Svix signature from Clerk
  const headerList = await headers();
  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }
  const payload = await req.text();

  let evt: WebhookEvent;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err: unknown) {
    console.error("❌ Clerk webhook signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // 2) Handle event
  try {
    if (!isUserEvent(evt)) {
      // Not a user.* event; ignore safely
      return NextResponse.json({ ok: true, ignored: true });
    }

    const { type, data } = evt;
    const clerkId = data.id;

    switch (type) {
      case "user.created": {
        // Intentionally no DB writes — you create the user after onboarding.
        break;
      }

      case "user.updated": {
        // If user already exists in our DB, sync name/email
        const email = getPrimaryEmail(data);
        const firstName = data.first_name ?? undefined;
        const lastName = data.last_name ?? undefined;

        const patch: Partial<{
          email: string;
          firstName: string;
          lastName: string;
        }> = {};
        if (email) patch.email = email;
        if (typeof firstName === "string") patch.firstName = firstName;
        if (typeof lastName === "string") patch.lastName = lastName;

        if (Object.keys(patch).length > 0) {
          try {
            await updateUser({ clerkId }, patch);
          } catch (e: unknown) {
            if (e instanceof NotFoundError) {
              // Not in DB yet (hasn't completed onboarding) — ignore
            } else {
              throw e;
            }
          }
        }
        break;
      }

      case "user.deleted": {
        // Soft-block if we have them
        try {
          await setStatus(clerkId, "blocked");
        } catch (e: unknown) {
          if (e instanceof NotFoundError) {
            // Not present — fine
          } else {
            throw e;
          }
        }
        break;
      }

      default: {
        // Other Clerk user.* events can be ignored or logged
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("❌ Clerk webhook handling error:", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
