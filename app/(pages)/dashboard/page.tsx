// /app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/actions/user.actions";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  let user;
  try {
    user = await getUserByClerkId(userId);
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-200">
        <div className="text-center">
          <p className="mb-4">We still need a few details.</p>
          <Link className="text-teal-400 underline" href="/onboarding">
            Go to onboarding
          </Link>
        </div>
      </div>
    );
  }

  if (user.kycStatus !== "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Almost there</h1>
          <p className="text-zinc-400 mb-6">
            Finish onboarding to unlock the app.
          </p>
          <Link
            href="/onboarding"
            className="rounded-lg bg-teal-500 px-4 py-2 font-medium text-black hover:bg-teal-400"
          >
            Continue onboarding
          </Link>
        </div>
      </div>
    );
  }

  // ...real dashboard here
  return (
    <div className=" text-white">dash</div>
  );
}
