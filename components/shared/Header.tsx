"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Accounts", href: "/account" },
  { name: "Strategies", href: "/strategies" },
  { name: "Following", href: "/following" },
  { name: "Settings", href: "/settings" },
];

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

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

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto max-w-6xl px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md px-3 py-2 text-white/80 hover:text-white transition"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <Link
              href="/dashboard"
              className="text-xl font-bold tracking-tight text-white hover:text-white/80 transition"
            >
              Haven
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <SignedIn>
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md px-4 py-2 text-sm text-white transition"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 text-xs font-bold text-black">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium">
                    {firstName}
                  </span>
                  <svg
                    className="ml-1"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    ref={menuRef}
                    role="menu"
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl"
                  >
                    <div className="px-4 py-3 text-xs text-white/60 border-b border-white/10">
                      <p className="uppercase tracking-wider font-medium">
                        Signed in as
                      </p>
                      <p className="truncate text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-300 font-medium mt-1">
                        {user?.emailAddresses[0]?.emailAddress}
                      </p>
                    </div>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Account
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                      role="menuitem"
                      onClick={async () => {
                        setMenuOpen(false);
                        await signOut();
                      }}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </SignedIn>

            <SignedOut>
              <Link
                href="/sign-in"
                className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white transition"
              >
                Sign in
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-md"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform bg-black/40 backdrop-blur-xl shadow-2xl border-r border-white/10 transition-transform duration-200 ease-out"
            style={{
              transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            }}
          >
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
              <span className="text-xl font-bold tracking-tight text-white">
                Haven
              </span>
              <button
                aria-label="Close menu"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md p-2 text-white/80 hover:text-white transition"
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

            <nav className="px-4 py-6">
              {navItems.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.name}
                  isActive={pathname === item.href}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
              <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/50 px-3">
                © {new Date().getFullYear()} Haven
              </div>
            </nav>
          </aside>
        </>
      )}
    </>
  );
};

function SidebarLink(props: {
  href: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const { href, label, isActive, onClick } = props;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block rounded-xl px-4 py-3 text-sm font-medium transition mb-1 ${
        isActive
          ? "bg-gradient-to-r from-violet-500 to-cyan-500/80 text-transparent bg-clip-text border border-white/20"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export default Header;
