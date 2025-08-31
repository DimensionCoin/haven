// components/shared/AutoPrivyProvision.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type AddressInput = {
  line1: string;
  line2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
};

type OnboardingForm = {
  email: string;
  firstName?: string;
  lastName?: string;
  countryISO: string;
  displayCurrency?: string;
  address: AddressInput;
  dob?: string;
  phoneNumber?: string;
  riskLevel?: "low" | "medium" | "high";
  consents?: Array<{ type: "tos" | "privacy" | "risk"; version: string }>;
};

export default function AutoPrivyProvision({ form }: { form: OnboardingForm }) {
  const { authenticated, login } = usePrivy();
  const { userId: clerkId, getToken } = useAuth();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      if (!clerkId) return;

      // 1) Make sure a Privy session exists (OTP flow may appear once)
      if (!authenticated) {
        await login(); // open Privy modal, no params
        ran.current = false; // allow rerun when state flips
        return;
      }

      // 2) POST to your server; let the server create/fetch the wallet
      try {
        const token = await getToken();
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            clerkId,
            ...form,
            // DO NOT send walletAddress / walletId — server will ensure them
          }),
        });

        if (!res.ok) {
          const msg = await res.text();
          console.error("Onboarding failed:", msg);
          return;
        }

        router.replace("/dashboard");
      } catch (e) {
        console.error("Onboarding error:", e);
      }
    })();
  }, [authenticated, clerkId, form, getToken, login, router]);

  return null;
}
