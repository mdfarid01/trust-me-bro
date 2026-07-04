"use client";

import { RefreshCw } from "lucide-react";
import type { AuthUser } from "@/app/lib/session";

type TrustScoreCardProps = {
  user: AuthUser;
  onRefresh: () => void;
  isRefreshing?: boolean;
};

function getScoreMeta(score: number) {
  if (score >= 90) {
    return { tier: "Elite", color: "var(--green)" };
  }

  if (score >= 75) {
    return { tier: "Reliable", color: "var(--green)" };
  }

  if (score >= 50) {
    return { tier: "Average", color: "var(--amber)" };
  }

  return { tier: "Risky", color: "var(--red)" };
}

export function TrustScoreCard({
  user,
  onRefresh,
  isRefreshing = false,
}: TrustScoreCardProps) {
  const score = Math.max(0, Math.min(100, user.trustScore.score));
  const agreementCount = user.trustScore.agreementCount;
  const meta = getScoreMeta(score);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (score / 100) * circumference;

  return (
    <section className="group rounded-[8px] border border-[var(--border)] bg-[linear-gradient(135deg,#0F1F0F_0%,#111111_48%,#111111_100%)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Trust Score
        </p>
        <button
          aria-label="Refresh trust score"
          className="rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--border)] hover:text-[var(--text)] disabled:opacity-50"
          disabled={isRefreshing}
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-end gap-3">
            <p
              className="text-[72px] font-bold leading-none tracking-[-0.06em]"
              style={{ color: meta.color }}
            >
              {score}
            </p>
            <span
              className="mb-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{
                borderColor: `${meta.color}40`,
                color: meta.color,
                backgroundColor: `${meta.color}14`,
              }}
            >
              {meta.tier}
            </span>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            {agreementCount} agreement{agreementCount === 1 ? "" : "s"} completed
          </p>
        </div>

        <div className="relative hidden h-[112px] w-[112px] shrink-0 sm:block">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 112 112">
            <circle
              cx="56"
              cy="56"
              fill="none"
              r={radius}
              stroke="var(--border)"
              strokeWidth="8"
            />
            <circle
              cx="56"
              cy="56"
              fill="none"
              r={radius}
              stroke={meta.color}
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              strokeWidth="8"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-[var(--muted)]">/100</span>
          </div>
        </div>
      </div>

      <div className="mt-6 h-[6px] overflow-hidden rounded-full bg-[var(--border)] sm:hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: meta.color }}
        />
      </div>
    </section>
  );
}

