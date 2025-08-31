// app/providers/PrivyProvider.tsx
"use client";
import { PrivyProvider } from "@privy-io/react-auth";

export default function PrivyProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["email"],
        embeddedWallets: { createOnLogin: "users-without-wallets" },
        // Remove defaultChain — it's for EVM (numeric id). Not needed for Solana.
        // If your version supports it, you could add:
        // defaultSolanaCluster: "devnet" | "mainnet-beta"
      }}
    >
      {children}
    </PrivyProvider>
  );
}
