"use client";

import { CheckCircle2, Loader2, LogOut, ShieldCheck, Wallet } from "lucide-react";
import bs58 from "bs58";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/app/lib/session";

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: {
    toBase58(): string;
  };
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  signMessage(message: Uint8Array, encoding: "utf8"): Promise<{ signature: Uint8Array }>;
};

type WindowWithPhantom = Window & {
  solana?: PhantomProvider;
};

type WalletAuthProps = {
  initialUser: AuthUser | null;
  onUserChange?: (user: AuthUser | null) => void;
};

type Status = "idle" | "connecting" | "connected" | "error";

export function WalletAuth({ initialUser, onUserChange }: WalletAuthProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [status, setStatus] = useState<Status>(initialUser ? "connected" : "idle");
  const [error, setError] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (!user) return "Not connected";
    return user.username ?? "Verified member";
  }, [user]);

  async function connectWallet() {
    setError(null);
    setStatus("connecting");

    try {
      const provider = (window as WindowWithPhantom).solana;

      if (!provider?.isPhantom) {
        throw new Error("Phantom is not installed.");
      }

      const connection = await provider.connect();
      const walletAddress = connection.publicKey.toBase58();

      const nonceResponse = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (!nonceResponse.ok) {
        throw new Error("Could not prepare sign-in.");
      }

      const { nonce } = (await nonceResponse.json()) as { nonce: string };
      const encodedNonce = new TextEncoder().encode(nonce);
      const signedMessage = await provider.signMessage(encodedNonce, "utf8");

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          signature: bs58.encode(signedMessage.signature),
          nonce,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Wallet signature could not be verified.");
      }

      const result = (await verifyResponse.json()) as {
        redirectTo?: string;
        user: AuthUser;
      };
      setUser(result.user);
      onUserChange?.(result.user);
      setStatus("connected");

      if (result.redirectTo === "/setup") {
        router.push("/setup");
      }
    } catch (connectError) {
      setUser(null);
      setStatus("error");
      setError(
        connectError instanceof Error
          ? connectError.message
          : "Something went wrong while connecting.",
      );
    }
  }

  async function disconnectWallet() {
    setError(null);
    await fetch("/api/auth/logout", { method: "DELETE" });
    setUser(null);
    onUserChange?.(null);
    setStatus("idle");
  }

  const isConnecting = status === "connecting";
  const isConnected = status === "connected" && user;

  return (
    <section className="w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--muted-foreground)]">Access</p>
          <h3 className="mt-2 text-xl font-semibold tracking-normal">Member sign-in</h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--surface)]">
          <ShieldCheck className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-6 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm text-[var(--muted-foreground)]">Status</p>
        <div className="mt-3 flex items-center gap-3">
          {isConnected ? (
            <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          ) : (
            <Wallet className="h-5 w-5 text-[var(--muted-foreground)]" aria-hidden="true" />
          )}
          <p className="text-base font-medium">{displayName}</p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/35 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {isConnected ? (
          <Button className="w-full rounded-[8px]" variant="secondary" onClick={disconnectWallet}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        ) : (
          <Button className="w-full rounded-[8px]" disabled={isConnecting} onClick={connectWallet}>
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Wallet className="h-4 w-4" aria-hidden="true" />
            )}
            {isConnecting ? "Verifying" : "Continue with Phantom"}
          </Button>
        )}
      </div>
    </section>
  );
}
