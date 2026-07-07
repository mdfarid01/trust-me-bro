"use client";

import { PublicKey, type Transaction, type VersionedTransaction } from "@solana/web3.js";
import {
  Brain,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Inbox,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  getTrustMeBroProgram,
  TRUST_ME_BRO_PROGRAM_ID,
} from "@/app/lib/program";
import type { AuthUser } from "@/app/lib/session";

type Agreement = {
  id: string;
  lenderId: string;
  borrowerId: string;
  amount: number;
  reason: string;
  dueDate: string;
  status: "PENDING" | "ACCEPTED" | "REPAID" | "CANCELLED";
  createdAt: string;
  acceptedAt: string | null;
  repaidAt: string | null;
  repaymentMarked: boolean;
  txSignature: string | null;
  inviteToken: string | null;
  lender: {
    username: string | null;
    walletAddress?: string;
  };
  borrower: {
    username: string | null;
    walletAddress?: string;
  };
};

type AcceptedAgreement = {
  id: string;
  lenderWalletAddress?: string;
};

type RepaidAgreement = {
  id: string;
  lenderWalletAddress?: string;
};

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]>;
};

type WindowWithPhantom = Window & {
  solana?: PhantomProvider;
};

type AgreementGroups = {
  pending: Agreement[];
  accepted: Agreement[];
  repaid: Agreement[];
};

type AgreementsDashboardProps = {
  refreshKey: number;
  user: AuthUser;
  onTrustScoreChange?: () => void;
};

const emptyGroups: AgreementGroups = {
  pending: [],
  accepted: [],
  repaid: [],
};

const statusCopy = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REPAID: "Repaid",
  CANCELLED: "Cancelled",
};

const statusClass = {
  PENDING: "bg-amber-950 text-amber-400",
  ACCEPTED: "bg-blue-950 text-blue-400",
  REPAID: "bg-green-950 text-green-400",
  CANCELLED: "bg-zinc-900 text-zinc-400",
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(value);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatParticipantName(person: {
  username: string | null;
  walletAddress?: string;
}) {
  if (person.username) {
    return person.username;
  }

  if (person.walletAddress) {
    return `${person.walletAddress.slice(0, 4)}...`;
  }

  return "Unknown";
}

function getAgreementDirection(agreement: Agreement, userId: string) {
  if (agreement.lenderId === userId) {
    return {
      arrow: "↗",
      label: `Lent to ${formatParticipantName(agreement.borrower)}`,
      arrowClass: "text-[var(--green)]",
    };
  }

  return {
    arrow: "↙",
    label: `Borrowed from ${formatParticipantName(agreement.lender)}`,
    arrowClass: "text-[var(--muted)]",
  };
}

function getNumericLoanId(loanId: string) {
  const maxSafeLoanId = 9_007_199_254_740_991;

  return Array.from(loanId).reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) % maxSafeLoanId;
  }, 7);
}

function loanIdToSeed(loanId: number) {
  const seed = new Uint8Array(8);
  let value = loanId;

  for (let index = 0; index < seed.length; index += 1) {
    seed[index] = value % 256;
    value = Math.floor(value / 256);
  }

  return seed;
}

function TextAction({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="text-sm font-medium text-[var(--muted)] hover:text-[var(--green)] disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center border-t border-[var(--border)] px-4 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[rgba(34,197,94,0.1)] text-[var(--green)]">
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm font-semibold text-[var(--text)]">
        No agreements yet
      </p>
      <a
        className="mt-2 text-sm text-[var(--muted)] hover:text-[var(--green)]"
        href="#new-agreement"
      >
        Create your first agreement →
      </a>
    </div>
  );
}

function ProofLink({ txSignature }: { txSignature: string }) {
  return (
    <a
      className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)]"
      href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
      rel="noreferrer"
      target="_blank"
    >
      View proof on Solana
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}

function InviteLinkButton({ inviteToken }: { inviteToken: string }) {
  const [isCopied, setIsCopied] = useState(false);

  async function copyInviteLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteToken}`);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  }

  return (
    <button
      className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)]"
      onClick={copyInviteLink}
      type="button"
    >
      {isCopied ? (
        <Check className="h-3 w-3 text-[var(--green)]" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3" aria-hidden="true" />
      )}
      {isCopied ? "Copied" : "Copy invite link"}
    </button>
  );
}

function AgreementRow({
  agreement,
  acceptingAgreementId,
  confirmingAgreementId,
  disableActions = false,
  explainingAgreementId,
  explanations,
  onAccept,
  onConfirm,
  onExplain,
  onRepay,
  repayingAgreementId,
  showInviteLink = false,
  userId,
}: {
  agreement: Agreement;
  acceptingAgreementId: string | null;
  confirmingAgreementId: string | null;
  disableActions?: boolean;
  explainingAgreementId: string | null;
  explanations: Record<string, string>;
  onAccept: (agreementId: string) => void;
  onConfirm: (agreementId: string) => void;
  onExplain: (agreementId: string) => void;
  onRepay: (agreementId: string) => void;
  repayingAgreementId: string | null;
  showInviteLink?: boolean;
  userId: string;
}) {
  const direction = getAgreementDirection(agreement, userId);
  const canAccept =
    !disableActions && agreement.status === "PENDING" && agreement.borrowerId === userId;
  const canMarkRepaid =
    !disableActions &&
    agreement.status === "ACCEPTED" &&
    agreement.borrowerId === userId &&
    !agreement.repaymentMarked;
  const canConfirm =
    !disableActions &&
    agreement.status === "ACCEPTED" &&
    agreement.lenderId === userId &&
    agreement.repaymentMarked;
  const canExplain = !disableActions && agreement.status === "REPAID";
  const hasProof = agreement.txSignature !== null;
  const hasInviteLink = showInviteLink && agreement.inviteToken !== null;
  const hasAction =
    canAccept || canMarkRepaid || canConfirm || canExplain || hasProof || hasInviteLink;

  return (
    <article className="border-t border-[var(--border)] py-5 transition hover:bg-[rgba(255,255,255,0.015)]">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[28px] font-bold leading-none tracking-[-0.04em] text-[var(--text)]">
            {formatAmount(agreement.amount)}
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]">
            <span className={`text-base ${direction.arrowClass}`}>{direction.arrow}</span>
            <span>{direction.label}</span>
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
            {agreement.reason}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[13px] text-[var(--muted)]">
            Due {formatShortDate(agreement.dueDate)}
          </p>
          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass[agreement.status]}`}
          >
            {statusCopy[agreement.status]}
          </span>
        </div>
      </div>

      {hasAction ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {canAccept ? (
            <TextAction
              disabled={acceptingAgreementId === agreement.id}
              onClick={() => onAccept(agreement.id)}
            >
              {acceptingAgreementId === agreement.id ? "Accepting..." : "Accept →"}
            </TextAction>
          ) : null}

          {canMarkRepaid ? (
            <TextAction
              disabled={repayingAgreementId === agreement.id}
              onClick={() => onRepay(agreement.id)}
            >
              {repayingAgreementId === agreement.id
                ? "Marking..."
                : "Mark repaid →"}
            </TextAction>
          ) : null}

          {canConfirm ? (
            <TextAction
              disabled={confirmingAgreementId === agreement.id}
              onClick={() => onConfirm(agreement.id)}
            >
              {confirmingAgreementId === agreement.id
                ? "Confirming..."
                : "Confirm →"}
            </TextAction>
          ) : null}

          {canExplain ? (
            <TextAction
              disabled={explainingAgreementId === agreement.id}
              onClick={() => onExplain(agreement.id)}
            >
              <span className="inline-flex items-center gap-1.5">
                {explainingAgreementId === agreement.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Brain className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Explain score →
              </span>
            </TextAction>
          ) : null}

          {agreement.txSignature !== null ? (
            <span className="ml-auto">
              <ProofLink txSignature={agreement.txSignature} />
            </span>
          ) : null}

          {showInviteLink && agreement.inviteToken !== null ? (
            <span className={agreement.txSignature === null ? "ml-auto" : ""}>
              <InviteLinkButton inviteToken={agreement.inviteToken} />
            </span>
          ) : null}
        </div>
      ) : null}

      {explanations[agreement.id] ? (
        <p className="mt-4 rounded-[8px] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm leading-6 text-[var(--muted)]">
          {explanations[agreement.id]}
        </p>
      ) : null}
    </article>
  );
}

function AgreementSection({
  agreements,
  title,
  ...rowProps
}: {
  agreements: Agreement[];
  title: string;
  acceptingAgreementId: string | null;
  confirmingAgreementId: string | null;
  explainingAgreementId: string | null;
  explanations: Record<string, string>;
  disableActions?: boolean;
  onAccept: (agreementId: string) => void;
  onConfirm: (agreementId: string) => void;
  onExplain: (agreementId: string) => void;
  onRepay: (agreementId: string) => void;
  repayingAgreementId: string | null;
  showInviteLink?: boolean;
  userId: string;
}) {
  return (
    <section>
      <div className="mb-6 flex items-center gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          {title}
        </h2>
        <span className="rounded-full bg-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)]">
          {agreements.length}
        </span>
      </div>

      {agreements.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {agreements.map((agreement) => (
            <AgreementRow
              agreement={agreement}
              key={agreement.id}
              {...rowProps}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function AgreementsDashboard({
  refreshKey,
  user,
  onTrustScoreChange,
}: AgreementsDashboardProps) {
  const [groups, setGroups] = useState<AgreementGroups>(emptyGroups);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingAgreementId, setAcceptingAgreementId] = useState<string | null>(null);
  const [repayingAgreementId, setRepayingAgreementId] = useState<string | null>(null);
  const [confirmingAgreementId, setConfirmingAgreementId] = useState<string | null>(
    null,
  );
  const [explainingAgreementId, setExplainingAgreementId] = useState<string | null>(
    null,
  );
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const sentAgreements = useMemo(
    () => groups.pending.filter((agreement) => agreement.lenderId === user.id),
    [groups.pending, user.id],
  );

  const awaitingAction = useMemo(
    () =>
      groups.pending.filter((agreement) => agreement.borrowerId === user.id),
    [groups.pending, user.id],
  );

  const inProgress = useMemo(
    () => groups.accepted,
    [groups.accepted],
  );

  async function loadAgreements() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/loans");
      const result = (await response.json()) as {
        loans?: AgreementGroups;
        error?: string;
      };

      if (!response.ok || !result.loans) {
        throw new Error(result.error ?? "Could not load agreements.");
      }

      setGroups(result.loans);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load agreements.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAgreements();
  }, [refreshKey]);

  async function acceptAgreementOnSolana(agreement: AcceptedAgreement) {
    const provider = (window as WindowWithPhantom).solana;

    if (!provider?.isPhantom || !agreement.lenderWalletAddress) {
      return;
    }

    const connection = await provider.connect();
    const signerPublicKey = new PublicKey(connection.publicKey.toBase58());
    const lenderPublicKey = new PublicKey(agreement.lenderWalletAddress);
    const numericLoanId = getNumericLoanId(agreement.id);
    const loanIdSeed = loanIdToSeed(numericLoanId);
    const [loanAccount] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("loan"), lenderPublicKey.toBuffer(), loanIdSeed],
      TRUST_ME_BRO_PROGRAM_ID,
    );

    const program = getTrustMeBroProgram({
      publicKey: signerPublicKey,
      signTransaction: provider.signTransaction.bind(provider),
      signAllTransactions: provider.signAllTransactions.bind(provider),
    });

    const txSignature = await program.methods
      .acceptLoan()
      .accounts({
        loan: loanAccount,
        signer: signerPublicKey,
      })
      .rpc();

    await fetch("/api/loans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loanId: agreement.id,
        txSignature,
      }),
    });
  }

  async function repayAgreementOnSolana(agreement: RepaidAgreement) {
    const provider = (window as WindowWithPhantom).solana;

    if (!provider?.isPhantom || !agreement.lenderWalletAddress) {
      return;
    }

    const connection = await provider.connect();
    const signerPublicKey = new PublicKey(connection.publicKey.toBase58());
    const lenderPublicKey = new PublicKey(agreement.lenderWalletAddress);
    const numericLoanId = getNumericLoanId(agreement.id);
    const loanIdSeed = loanIdToSeed(numericLoanId);
    const [loanAccount] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("loan"), lenderPublicKey.toBuffer(), loanIdSeed],
      TRUST_ME_BRO_PROGRAM_ID,
    );

    const program = getTrustMeBroProgram({
      publicKey: signerPublicKey,
      signTransaction: provider.signTransaction.bind(provider),
      signAllTransactions: provider.signAllTransactions.bind(provider),
    });

    const txSignature = await program.methods
      .repayLoan()
      .accounts({
        loan: loanAccount,
        signer: signerPublicKey,
      })
      .rpc();

    await fetch("/api/loans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loanId: agreement.id,
        txSignature,
      }),
    });
  }

  async function acceptAgreement(agreementId: string) {
    setAcceptingAgreementId(agreementId);
    setError(null);

    try {
      const response = await fetch(`/api/loans/${agreementId}/accept`, {
        method: "POST",
      });
      const result = (await response.json()) as {
        loan?: AcceptedAgreement;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Could not accept agreement.");
      }

      if (result.loan) {
        await acceptAgreementOnSolana(result.loan).catch((syncError) => {
          console.error("Agreement accepted, but proof sync failed.", syncError);
        });
      }

      await loadAgreements();
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Could not accept agreement.",
      );
    } finally {
      setAcceptingAgreementId(null);
    }
  }

  async function markRepaid(agreementId: string) {
    setRepayingAgreementId(agreementId);
    setError(null);

    try {
      const response = await fetch(`/api/loans/${agreementId}/repay`, {
        method: "POST",
      });
      const result = (await response.json()) as {
        loan?: RepaidAgreement;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Could not mark repayment.");
      }

      if (result.loan) {
        await repayAgreementOnSolana(result.loan).catch((syncError) => {
          console.error("Repayment marked, but proof sync failed.", syncError);
        });
      }

      await loadAgreements();
    } catch (repayError) {
      setError(
        repayError instanceof Error ? repayError.message : "Could not mark repayment.",
      );
    } finally {
      setRepayingAgreementId(null);
    }
  }

  async function confirmRepayment(agreementId: string) {
    setConfirmingAgreementId(agreementId);
    setError(null);

    try {
      const response = await fetch(`/api/loans/${agreementId}/confirm`, {
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Could not confirm repayment.");
      }

      onTrustScoreChange?.();
      await loadAgreements();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Could not confirm repayment.",
      );
    } finally {
      setConfirmingAgreementId(null);
    }
  }

  async function explainAgreement(agreementId: string) {
    setExplainingAgreementId(agreementId);
    setError(null);

    try {
      const response = await fetch(`/api/loans/${agreementId}/explanation`);
      const result = (await response.json()) as {
        explanation?: string;
        error?: string;
      };

      if (!response.ok || !result.explanation) {
        throw new Error(result.error ?? "Could not explain this score change.");
      }

      setExplanations((current) => ({
        ...current,
        [agreementId]: result.explanation ?? "",
      }));
    } catch (explainError) {
      setError(
        explainError instanceof Error
          ? explainError.message
          : "Could not explain this score change.",
      );
    } finally {
      setExplainingAgreementId(null);
    }
  }

  const rowProps = {
    acceptingAgreementId,
    confirmingAgreementId,
    explainingAgreementId,
    explanations,
    onAccept: acceptAgreement,
    onConfirm: confirmRepayment,
    onExplain: explainAgreement,
    onRepay: markRepaid,
    repayingAgreementId,
    userId: user.id,
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Agreements
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-[var(--text)]">
            Money between people, made clear.
          </h1>
        </div>
        <button
          aria-label="Refresh agreements"
          className="rounded-[8px] p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] disabled:opacity-50"
          disabled={isLoading}
          onClick={loadAgreements}
          type="button"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {error ? (
        <p className="mb-6 rounded-[8px] border border-red-950 bg-red-950/30 px-3 py-2 text-sm text-[var(--red)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-12">
        <AgreementSection
          agreements={sentAgreements}
          disableActions={true}
          showInviteLink={true}
          title="Sent — waiting for response"
          {...rowProps}
        />
        <AgreementSection
          agreements={awaitingAction}
          title="Awaiting action"
          {...rowProps}
        />
        <AgreementSection agreements={inProgress} title="In progress" {...rowProps} />
        <AgreementSection agreements={groups.repaid} title="Completed" {...rowProps} />
      </div>
    </div>
  );
}
