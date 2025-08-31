"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";

type FormState = {
  countryISO: string;
  displayCurrency: string;
  line1: string;
  line2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  phoneNumber?: string;
  dob?: string; // yyyy-mm-dd
  riskLevel: "low" | "medium" | "high";
  acceptTos: boolean;
  acceptPrivacy: boolean;
  acceptRisk: boolean;
};

const COUNTRY_DEFAULTS: Record<string, { currency: string }> = {
  CA: { currency: "CAD" },
  US: { currency: "USD" },
  GB: { currency: "GBP" },
  EU: { currency: "EUR" },
};

/** Minimal, SDK-agnostic shape we care about, for a type guard */
type MaybeWallet = {
  chain?: string;
  chainType?: string;
  type?: string;
  walletClientType?: string;
  address?: string;
  id?: string;
};

/** Narrow unknown → “embedded solana with an address” */
function isSolanaEmbedded(
  w: unknown
): w is Required<Pick<MaybeWallet, "address">> & MaybeWallet {
  if (!w || typeof w !== "object") return false;
  const ww = w as MaybeWallet;
  const chainVal = ww.chain ?? ww.chainType ?? ww.type;
  const isSol = chainVal === "solana";
  const isEmbedded = ww.walletClientType
    ? ww.walletClientType === "privy"
    : true;
  return Boolean(isSol && isEmbedded && ww.address);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // Privy
  const { ready, authenticated, user: privyUser, login } = usePrivy();
  const { wallets } = useWallets();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privyNotice, setPrivyNotice] = useState<
    | { kind: "idle" }
    | { kind: "prompting" }
    | { kind: "auth"; email?: string }
    | { kind: "wallet-ready" }
  >({ kind: "idle" });

  // ensure we only call login() once per mount
  const kickedOff = useRef(false);

  // Fire Privy OTP asap, but do NOT block the form.
  useEffect(() => {
    if (!ready || authenticated || kickedOff.current) return;
    kickedOff.current = true;

    (async () => {
      try {
        setPrivyNotice({ kind: "prompting" });
        console.log("[privy] opening login modal");
        await login(); // user completes OTP here (or session is restored)
        setPrivyNotice({ kind: "auth", email: privyUser?.email?.address });
        console.log("[privy] authenticated:", true);
      } catch (e) {
        // If they close the modal, it's fine — form still usable
        console.warn("[privy] login() dismissed/failed:", e);
        setPrivyNotice({ kind: "idle" });
      }
    })();
  }, [ready, authenticated, login, privyUser?.email?.address]);

  // If a wallet appears later, show a friendly “ready” message (non-blocking)
  useEffect(() => {
    if (!authenticated) return;
    const found = wallets.find(isSolanaEmbedded);
    if (found?.address) {
      setPrivyNotice({ kind: "wallet-ready" });
      console.log("[privy] embedded wallet detected:", found.address);
    }
  }, [authenticated, wallets]);

  // Form state
  const [form, setForm] = useState<FormState>({
    countryISO: "CA",
    displayCurrency: "CAD",
    line1: "",
    line2: "",
    city: "",
    stateOrProvince: "",
    postalCode: "",
    phoneNumber: "",
    dob: "",
    riskLevel: "low",
    acceptTos: false,
    acceptPrivacy: false,
    acceptRisk: false,
  });

  // auto-set displayCurrency when country changes
  useEffect(() => {
    const up = form.countryISO.toUpperCase();
    const def = COUNTRY_DEFAULTS[up];
    if (def && form.displayCurrency !== def.currency) {
      setForm((p) => ({ ...p, displayCurrency: def.currency }));
    }
  }, [form.countryISO, form.displayCurrency]);

  const primaryEmail = useMemo(() => {
    if (!user) return "";
    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress;
    return (email ?? "").toLowerCase().trim();
  }, [user]);

  if (!isLoaded) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!user) throw new Error("Not signed in.");
      if (!form.acceptTos || !form.acceptPrivacy || !form.acceptRisk) {
        throw new Error("Please accept all policies to continue.");
      }

      // We do NOT wait for Privy here — server ensures/reuses wallet.
      const payload = {
        clerkId: user.id,
        email: primaryEmail,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        countryISO: form.countryISO.toUpperCase(),
        displayCurrency: form.displayCurrency.toUpperCase(),
        address: {
          line1: form.line1,
          line2: form.line2 || "",
          city: form.city,
          stateOrProvince: form.stateOrProvince,
          postalCode: form.postalCode,
          country: form.countryISO.toUpperCase(),
        },
        phoneNumber: form.phoneNumber || undefined,
        dob: form.dob ? new Date(form.dob) : undefined,
        riskLevel: form.riskLevel,
        consents: [
          { type: "tos", version: "1.0.0" },
          { type: "privacy", version: "1.0.0" },
          { type: "risk", version: "1.0.0" },
        ],
      };

      const token = await getToken();
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to complete onboarding.");
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const renderPrivyNotice = () => {
    if (privyNotice.kind === "prompting")
      return "Verify your email with Privy to pre-create your wallet (optional).";
    if (privyNotice.kind === "auth")
      return "Email verified with Privy — finishing up…";
    if (privyNotice.kind === "wallet-ready")
      return "Embedded wallet is ready ✔︎";
    return null;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-[rgba(182,255,62,0.08)] rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[rgba(182,255,62,0.06)] rounded-full blur-3xl" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
            Complete Your Haven Setup
          </h1>
          <p className="text-zinc-400">
            Finish your account setup to unlock DeFi-powered savings with
            traditional banking security.
          </p>
          {renderPrivyNotice() && (
            <div className="mt-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300">
              {renderPrivyNotice()}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Country + Display Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">
                  Country (ISO-2)
                </span>
                <input
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2"
                  placeholder="CA"
                  value={form.countryISO}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      countryISO: e.target.value.toUpperCase(),
                    }))
                  }
                  maxLength={2}
                  required
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">
                  Display Currency (ISO-4217)
                </span>
                <input
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2"
                  placeholder="CAD"
                  value={form.displayCurrency}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      displayCurrency: e.target.value.toUpperCase(),
                    }))
                  }
                  maxLength={3}
                  required
                />
              </label>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-zinc-300">
                  Address line 1
                </span>
                <input
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2"
                  value={form.line1}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, line1: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-zinc-300">
                  Address line 2 (optional)
                </span>
                <input
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2"
                  value={form.line2}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, line2: e.target.value }))
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">City</span>
                <input
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2"
                  value={form.city}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, city: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">
                  State/Province
                </span>
                <input
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2"
                  value={form.stateOrProvince}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, stateOrProvince: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">
                  Postal code
                </span>
                <input
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, postalCode: e.target.value }))
                  }
                  required
                />
              </label>
            </div>

            {/* Optional PII */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">
                  Phone (E.164)
                </span>
                <input
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2"
                  placeholder="+14165551234"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phoneNumber: e.target.value }))
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">
                  Date of birth
                </span>
                <input
                  type="date"
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2"
                  value={form.dob}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dob: e.target.value }))
                  }
                />
              </label>
            </div>

            {/* Risk */}
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-300">
                Savings risk preference
              </span>
              <select
                className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2"
                value={form.riskLevel}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    riskLevel: e.target.value as FormState["riskLevel"],
                  }))
                }
              >
                <option value="low" className="bg-zinc-900 text-white">
                  Low (stablecoin yields only)
                </option>
                <option value="medium" className="bg-zinc-900 text-white">
                  Medium (yields + major assets)
                </option>
                <option value="high" className="bg-zinc-900 text-white">
                  High (aggressive strategies)
                </option>
              </select>
            </label>

            {/* Consents */}
            <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">
                Required Agreements
              </h3>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.acceptTos}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, acceptTos: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-white/20 bg-white/10"
                />
                <span className="text-sm text-zinc-300">
                  I accept the Terms of Service
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.acceptPrivacy}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, acceptPrivacy: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-white/20 bg-white/10"
                />
                <span className="text-sm text-zinc-300">
                  I accept the Privacy Policy
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.acceptRisk}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, acceptRisk: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-white/20 bg-white/10"
                />
                <span className="text-sm text-zinc-300">
                  I understand the investment risks
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[rgb(182,255,62)] px-6 py-3 font-semibold text-black hover:bg-[rgb(182,255,62)]/90 disabled:opacity-60 transition-all duration-200 shadow-lg hover:shadow-[rgb(182,255,62)]/25"
              >
                {submitting ? "Working…" : "Complete Setup"}
              </button>
              <button
                type="button"
                disabled={submitting}
                className="rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-zinc-300 hover:bg-white/10 hover:border-white/30"
                onClick={() => router.push("/dashboard")}
                title="You can complete KYC later — your dashboard will be locked until you do."
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
