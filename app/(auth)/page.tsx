"use client";

import Link from "next/link";

const Landing = () => {
  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      {/* Top nav */}
      <header className="container mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="text-xl font-bold tracking-tight">Haven</div>
        <nav className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/15 border border-white/20 backdrop-blur-md transition"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto max-w-6xl px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Save Money
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-300">
              faster and easier
            </span>
          </h1>
          

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/30 transition"
            >
              Get started — Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
            >
              Sign up
            </Link>
          </div>

          <p className="mt-4 text-xs text-white/50">
            No account yet? You can create one from the sign-up page.
          </p>
        </div>

        {/* Pretty mock card */}
        <div className="relative">
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 shadow-2xl">
            <div className="h-64 md:h-80 rounded-2xl bg-gradient-to-br from-cyan-400/20 via-fuchsia-400/10 to-amber-300/10 border border-white/10" />
            <div className="mt-4 h-3 w-3/4 rounded-full bg-white/10" />
            <div className="mt-2 h-3 w-1/2 rounded-full bg-white/10" />
          </div>

          {/* glow */}
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-r from-violet-600/20 via-fuchsia-600/10 to-cyan-500/20 blur-2xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="container mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-xs text-white/50">
          <span>© {new Date().getFullYear()} Haven</span>
          <div className="flex gap-4">
            <a className="hover:text-white/80" href="#">
              Privacy
            </a>
            <a className="hover:text-white/80" href="#">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
