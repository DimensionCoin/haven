"use client";

import type React from "react";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

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
  EU: { currency: "EUR" }, // you can map specific EU countries too
};

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sensible defaults (Canada)
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
    const upper = form.countryISO.toUpperCase();
    const def = COUNTRY_DEFAULTS[upper];
    if (def && form.displayCurrency !== def.currency) {
      setForm((prev) => ({ ...prev, displayCurrency: def.currency }));
    }
  }, [form.countryISO, form.displayCurrency]);

  const primaryEmail = useMemo(() => {
    if (!user) return "";
    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress;
    return (email ?? "").toLowerCase().trim();
  }, [user]);

  // If Clerk isn't loaded, hold the UI briefly
  if (!isLoaded) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Minimal client-side checks
      if (!user) throw new Error("Not signed in.");
      if (!form.acceptTos || !form.acceptPrivacy || !form.acceptRisk) {
        throw new Error("Please accept all policies to continue.");
      }

      const payload = {
        clerkId: user.id,
        email: primaryEmail,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        walletAddress: "", // server will generate
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

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to complete onboarding.");
      }

      // Success — go to dashboard (the dashboard will be locked until KYC is approved)
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

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
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-white placeholder-zinc-400 focus:border-[rgb(182,255,62)] focus:ring-1 focus:ring-[rgb(182,255,62)] transition-colors"
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
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-white placeholder-zinc-400 focus:border-[rgb(182,255,62)] focus:ring-1 focus:ring-[rgb(182,255,62)] transition-colors"
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
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-white placeholder-zinc-400 focus:border-[rgb(182,255,62)] focus:ring-1 focus:ring-[rgb(182,255,62)] transition-colors"
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
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-white placeholder-zinc-400 focus:border-[rgb(182,255,62)] focus:ring-1 focus:ring-[rgb(182,255,62)] transition-colors"
                  value={form.line2}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, line2: e.target.value }))
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">City</span>
                <input
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-white placeholder-zinc-400 focus:border-[rgb(182,255,62)] focus:ring-1 focus:ring-[rgb(182,255,62)] transition-colors"
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
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-white placeholder-zinc-400 focus:border-[rgb(182,255,62)] focus:ring-1 focus:ring-[rgb(182,255,62)] transition-colors"
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
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-white placeholder-zinc-400 focus:border-[rgb(182,255,62)] focus:ring-1 focus:ring-[rgb(182,255,62)] transition-colors"
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
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-white placeholder-zinc-400 focus:border-[rgb(182,255,62)] focus:ring-1 focus:ring-[rgb(182,255,62)] transition-colors"
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
                  className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-white placeholder-zinc-400 focus:border-[rgb(182,255,62)] focus:ring-1 focus:ring-[rgb(182,255,62)] transition-colors"
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
                className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-white focus:border-[rgb(182,255,62)] focus:ring-1 focus:ring-[rgb(182,255,62)] transition-colors"
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
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-[rgb(182,255,62)] focus:ring-[rgb(182,255,62)] focus:ring-offset-0"
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
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-[rgb(182,255,62)] focus:ring-[rgb(182,255,62)] focus:ring-offset-0"
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
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-[rgb(182,255,62)] focus:ring-[rgb(182,255,62)] focus:ring-offset-0"
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
                {submitting ? "Saving..." : "Complete Setup"}
              </button>
              <button
                type="button"
                disabled={submitting}
                className="rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-6 py-3 text-zinc-300 hover:bg-white/10 hover:border-white/30 transition-all duration-200"
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
