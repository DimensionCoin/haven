// app/api/me/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/actions/user.actions";

export const dynamic = "force-dynamic";

export async function GET() {
  // ✅ Await the promise
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const user = await getUserByClerkId(userId);

    // Return only what the client needs
    return NextResponse.json({
      ok: true,
      user: {
        clerkId: user.clerkId,
        kycStatus: user.kycStatus,
        status: user.status,
      },
    });
  } catch {
    // Not found means they haven't onboarded yet
    return NextResponse.json({ ok: true, user: null });
  }
}
