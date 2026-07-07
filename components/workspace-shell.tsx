"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { AgreementsDashboard } from "@/components/agreements-dashboard";
import { CreateAgreementForm } from "@/components/create-agreement-form";
import { TrustScoreCard } from "@/components/trust-score-card";
import { WalletAuth } from "@/components/wallet-auth";
import type { AuthUser } from "@/app/lib/session";

type WorkspaceShellProps = {
  initialUser: AuthUser | null;
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function WorkspaceShell({ initialUser }: WorkspaceShellProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [agreementsRefreshKey, setAgreementsRefreshKey] = useState(0);
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);
  const [isUsernameBannerDismissed, setIsUsernameBannerDismissed] = useState(false);
  const displayName = user?.username ?? "there";
  const showUsernameBanner =
    Boolean(user && !user.username) && !isUsernameBannerDismissed;

  async function refreshUser() {
    if (!user) return;

    setIsRefreshingUser(true);

    try {
      const response = await fetch("/api/auth/me");
      const result = (await response.json()) as { user?: AuthUser };

      if (response.ok && result.user) {
        setUser(result.user);
      }
    } finally {
      setIsRefreshingUser(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "DELETE" });
    setUser(null);
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex h-[60px] max-w-[1100px] items-center justify-between px-6">
          <div className="min-w-0">
            <p className="truncate text-[18px] font-bold tracking-normal text-[var(--text)]">
              🤝 Trust Me Bro
            </p>
            <p className="hidden text-xs text-[var(--muted)] sm:block">
              Lending money should not ruin friendships
            </p>
          </div>

          {user ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-[var(--muted)] sm:inline">
                {getGreeting()}, {displayName}
              </span>
              <button
                className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]"
                onClick={signOut}
                type="button"
              >
                Logout
              </button>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">Private agreements</p>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1100px] px-6 pt-[60px]">
        {user ? (
          <div>
            {showUsernameBanner ? (
              <div className="mt-6 flex items-center justify-between gap-4 rounded-[8px] border border-amber-900/70 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
                <a className="font-medium hover:text-amber-100" href="/setup">
                  👤 Set your username →
                </a>
                <button
                  aria-label="Dismiss username reminder"
                  className="rounded-[8px] p-1 text-amber-300 hover:bg-amber-900/40 hover:text-amber-100"
                  onClick={() => setIsUsernameBannerDismissed(true)}
                  type="button"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}

            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.6fr)_minmax(320px,0.4fr)]">
            <aside className="order-1 grid h-[calc(100vh-60px)] gap-5 overflow-y-auto py-8 pr-1 lg:order-2">
              <TrustScoreCard
                isRefreshing={isRefreshingUser}
                onRefresh={refreshUser}
                user={user}
              />
              <CreateAgreementForm
                onAgreementCreated={() =>
                  setAgreementsRefreshKey((currentKey) => currentKey + 1)
                }
              />
            </aside>

            <section className="order-2 h-[calc(100vh-60px)] overflow-y-auto py-8 pr-1 lg:order-1">
              <AgreementsDashboard
                onTrustScoreChange={refreshUser}
                refreshKey={agreementsRefreshKey}
                user={user}
              />
            </section>
          </div>
          </div>
        ) : (
          <div className="mx-auto grid max-w-[720px] gap-8 py-8">
            <section className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-8">
              <p className="text-4xl font-bold tracking-[-0.02em] text-[var(--text)] sm:text-5xl">
                Friendly lending, written clearly.
              </p>
              <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
                Create simple repayment agreements with people you trust, keep
                score privately, and avoid awkward memory games later.
              </p>
            </section>
            <WalletAuth initialUser={user} onUserChange={setUser} />
          </div>
        )}
      </div>
    </main>
  );
}
