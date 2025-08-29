"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";

const NAV = [
  { name: "My Balance", href: "/dashboard" },
  { name: "Accounts", href: "/accounts" },
  { name: "Cards", href: "/cards" },
  { name: "Transactions", href: "/transactions" },
];

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState("");

  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
  }, [menuOpen, sidebarOpen]); // Added sidebarOpen to dependency array to fix unused variable warning

  const firstName = user?.firstName ?? "User";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  return (
    <>
      {/* top bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/40 backdrop-blur">
        <div className="flex h-8 items-center justify-between bg-black/20 px-4 text-xs text-white/90 md:hidden">
          <span className="font-medium">{currentTime}</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="h-1 w-1 rounded-full bg-white/60"></div>
              <div className="h-1 w-1 rounded-full bg-white/80"></div>
              <div className="h-1 w-1 rounded-full bg-white"></div>
              <div className="h-1 w-1 rounded-full bg-white"></div>
            </div>
            <svg
              className="ml-1 h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M17 4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM5 6h10v4H5V6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div className="mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
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
                  <p className="font-semibold text-foreground">Haven Bank</p>
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
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-foreground hover:bg-white/20 transition-colors">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z"
                  />
                </svg>
              </button>

              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-foreground hover:bg-white/20 transition-colors">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5-5v5zM4 12l5 5 5-5"
                  />
                </svg>
              </button>

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
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-3xl glass shadow-2xl"
                  >
                    <div className="border-b border-border px-4 py-3 text-xs text-muted-foreground">
                      <p className="uppercase tracking-wide">Signed in as</p>
                      <p className="truncate text-foreground">{email}</p>
                    </div>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-white/5"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      Account
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-white/5"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      Settings
                    </Link>
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
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

              <button
                aria-label="Open menu"
                onClick={() => setSidebarOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-foreground hover:bg-white/20 transition-colors md:hidden"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 6h12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </SignedIn>

            <SignedOut>
              <Link href="/sign-in" className="btn-neon text-sm">
                Sign in
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* sidebar drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 ease-out"
            style={{
              transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            }}
          >
            <div className="glass h-full border-r border-border">
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <span className="font-semibold text-foreground">Menu</span>
                <button
                  aria-label="Close menu"
                  onClick={() => setSidebarOpen(false)}
                  className="icon-btn"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <nav className="px-2 py-3">
                {NAV.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`mb-1 block rounded-2xl px-3 py-2 text-sm transition ${
                        active
                          ? "tab-active"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}

                <div className="mt-6 border-t border-border px-3 pt-4 text-xs text-muted-foreground">
                  © {new Date().getFullYear()} Haven Bank
                </div>
              </nav>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
