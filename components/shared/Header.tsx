"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import { BellIcon } from "lucide-react";

const NAV = [
  { name: "My Balance", href: "/dashboard" },
  { name: "Accounts", href: "/account" },
  { name: "Invest", href: "/invest" },
  { name: "Activity", href: "/activity" },
  { name: "Cards", href: "/cards" },
];

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const router = useRouter();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // 🔑 Check KYC status
  useEffect(() => {
    async function checkKyc() {
      if (!user) return; // only run when logged in
      try {
        const res = await fetch("/api/me");
        const data = await res.json();

        if (data.ok && data.user) {
          if (
            data.user.kycStatus !== "approved" &&
            pathname !== "/onboarding"
          ) {
            router.replace("/onboarding");
          }
        } else {
          // user record not found → send to onboarding
          if (pathname !== "/onboarding") {
            router.replace("/onboarding");
          }
        }
      } catch (err) {
        console.error("KYC check failed", err);
      }
    }

    checkKyc();
  }, [user, pathname, router]);

  // Handle menu dismiss
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(t) &&
        buttonRef.current &&
        !buttonRef.current.contains(t)
      ) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const firstName = user?.firstName ?? "User";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/40 backdrop-blur">
        <div className="mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Link href={"/dashboard"}>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <svg
                      className="h-4 w-4 text-primary-foreground"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2L3 7v11h4v-6h6v6h4V7l-7-5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <SignedIn>
                      <p className="text-xs text-muted-foreground">Hello,</p>
                      <p className="font-semibold text-foreground">
                        {user?.firstName}
                      </p>
                    </SignedIn>
                    <SignedOut>
                      <Link
                        href="/dashboard"
                        className="font-semibold text-foreground"
                      >
                        Haven Bank
                      </Link>
                    </SignedOut>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm transition-all ${
                    active
                      ? "bg-primary/20 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* right side */}
          <div className="flex items-center gap-3">
            <SignedIn>
              <Link href={"/notifications"}>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-foreground hover:bg-white/20 transition-colors">
                  <BellIcon />
                </button>
              </Link>

              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/80 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {firstName.charAt(0).toUpperCase()}
                </button>

                {menuOpen && (
                  <div
                    ref={menuRef}
                    role="menu"
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-3xl menu-surface"
                  >
                    <div className="menu-divider border-b px-4 py-3 text-xs text-muted-foreground">
                      <p className="uppercase tracking-wide">Signed in as</p>
                      <p className="truncate text-foreground">{email}</p>
                    </div>

                    <Link
                      href="/settings"
                      className="menu-item"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      Settings
                    </Link>

                    <button
                      className="w-full text-left menu-item text-red-300 hover:bg-red-500/10"
                      onClick={async () => {
                        setMenuOpen(false);
                        await signOut();
                      }}
                      role="menuitem"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </SignedIn>

            <SignedOut>
              <Link href="/sign-in" className="btn-neon text-sm">
                Sign in
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>
    </>
  );
}
