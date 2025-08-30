// lib/privy.ts
import "server-only";
import { PrivyClient } from "@privy-io/server-auth";

const PRIVY_APP_ID = process.env.PRIVY_APP_ID!;
const PRIVY_SECRET_KEY = process.env.PRIVY_SECRET_KEY!;

function requireEnv(name: string, val?: string) {
  if (!val) throw new Error(`[privy] Missing env var: ${name}`);
}
requireEnv("PRIVY_APP_ID", PRIVY_APP_ID);
requireEnv("PRIVY_SECRET_KEY", PRIVY_SECRET_KEY);

// very light Solana addr check
function looksLikeSolanaAddress(addr: unknown): addr is string {
  return (
    typeof addr === "string" &&
    addr.length >= 32 &&
    addr.length <= 64 &&
    /^[1-9A-HJ-NP-Za-km-z]+$/.test(addr)
  );
}

export async function ensurePrivyEmbeddedWallet(params: {
  externalUserId: string; // Clerk user id (kept for future assoc; some SDKs ignore)
  chain: "solana";
  email?: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ address: string; walletId: string }> {
  // NOTE: the current server-auth SDK constructs like: new PrivyClient(appId, appSecret)
  const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_SECRET_KEY);

  // Minimal create (many SDK versions don’t support listing by user yet)
  const created = await privy.walletApi.createWallet({
    chainType: "solana",
    // If your SDK version supports this field, it’ll associate to your user:
    // externalUserId: params.externalUserId,
  });

  const walletId = created?.id as string | undefined;
  const address = created?.address as string | undefined;

  if (!walletId || !looksLikeSolanaAddress(address)) {
    throw new Error("[privy] createWallet returned invalid id/address");
  }

  console.log(
    `[privy] created Solana wallet for user ${params.externalUserId}:`,
    { walletId, address }
  );

  return { address, walletId };
}
