"use client";

import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  type Transaction,
  type VersionedTransaction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { Check, CheckCircle2, Copy, Loader2, Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { TRUST_ME_BRO_ANCHOR_IDL } from "@/lib/anchor-idl";

type CreatedAgreement = {
  id: string;
  amount: number;
  reason: string;
  dueDate: string;
  status: "PENDING" | "ACCEPTED" | "REPAID" | "CANCELLED";
  txSignature: string | null;
  inviteToken: string | null;
  borrowerWalletAddress?: string;
  lenderWalletAddress?: string;
  borrower: {
    username: string | null;
  };
};

type CreateAgreementFormProps = {
  onAgreementCreated?: () => void;
};

type PhantomSolanaProvider = {
  isConnected?: boolean;
  isPhantom?: boolean;
  publicKey?: {
    toBase58(): string;
  };
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  signAndSendTransaction?<T extends Transaction | VersionedTransaction>(
  transaction: T,
  options?: {
    skipPreflight?: boolean;
    preflightCommitment?: "processed" | "confirmed" | "finalized";
  },
): Promise<{ signature: string } | string>;
};

type WindowWithPhantom = Window & {
  phantom?: {
    solana?: PhantomSolanaProvider;
  };
};

const PROGRAM_ID = new PublicKey(
  "62x4fhaFhshjbsMvvgP4oyTqiGRftqQGQLr5JMidWPXk",
);

const inputClass =
  "w-full rounded-[8px] border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] hover:border-zinc-700 focus:border-[var(--green)]";

function getNumericLoanId(loanId: string) {
  // Use timestamp + random to ensure uniqueness every time
  return Date.now() % 1_000_000 + Math.floor(Math.random() * 1000);
}

function getPublicKey(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return new PublicKey(value);
  } catch {
    return null;
  }
}

export function CreateAgreementForm({ onAgreementCreated }: CreateAgreementFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [borrowerWallet, setBorrowerWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  async function createLoanAgreementOnSolana(loan: CreatedAgreement) {
    const phantom = (window as WindowWithPhantom).phantom?.solana;

    if (!phantom?.isPhantom) {
      throw new Error("Phantom wallet not found. Please install Phantom.");
    }

    if (!phantom.isConnected) {
      await phantom.connect();
    }

    const activePublicKey = loan.lenderWalletAddress
      ? new PublicKey(loan.lenderWalletAddress)
      : null;

    if (!activePublicKey) {
      throw new Error("Please reconnect your Phantom wallet");
    }

    const borrowerPubkey = new PublicKey(loan.borrowerWalletAddress!);
    const loanIdNum = getNumericLoanId(loan.id);
    const loanIdBuffer = Buffer.alloc(8);
    loanIdBuffer.writeBigUInt64LE(BigInt(loanIdNum));

    const [loanPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan"), activePublicKey.toBuffer(), loanIdBuffer],
      PROGRAM_ID,
    );

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    const mockWallet = {
      publicKey: activePublicKey,
      signTransaction: async (tx: unknown) => tx,
      signAllTransactions: async (txs: unknown) => txs,
    };

    const provider = new AnchorProvider(connection, mockWallet as never, {
      commitment: "confirmed",
    });

    const program = new Program(TRUST_ME_BRO_ANCHOR_IDL, provider);
    const transaction = await program.methods
      .createLoan(
        new BN(loanIdNum),
        new BN(Math.floor(loan.amount * 1_000_000)),
        loan.reason,
        new BN(Math.floor(new Date(loan.dueDate).getTime() / 1000)),
      )
      .accounts({
        loan: loanPDA,
        lender: activePublicKey,
        borrower: borrowerPubkey,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    transaction.feePayer = activePublicKey;
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;

    if (!phantom.signAndSendTransaction) {
      throw new Error("Phantom cannot sign this transaction. Please reconnect.");
    }

    // const { signature } = await phantom.signAndSendTransaction(transaction);//
    const result = await phantom.signAndSendTransaction(transaction, {
  skipPreflight: true,
  preflightCommitment: "confirmed",
} as any);
const signature = typeof result === "string" ? result : result.signature;
    await connection.confirmTransaction(signature, "confirmed");

    await fetch(`/api/loans/${loan.id}/signature`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txSignature: signature }),
    });
  }

  async function createAgreement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedMessage(null);
    setInviteLink(null);
    setIsCopied(false);
    setIsSubmitting(true);
    setIsRecording(false);

    try {
      const borrowerPublicKey = getPublicKey(borrowerWallet.trim());

      if (!borrowerPublicKey) {
        throw new Error("Enter a valid Solana wallet address.");
      }

      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerWallet: borrowerPublicKey.toBase58(),
          amount: Number(amount),
          reason,
          dueDate,
        }),
      });

      const result = (await response.json()) as {
        loan?: CreatedAgreement;
        error?: string;
      };

      if (!response.ok || !result.loan) {
        throw new Error(result.error ?? "Could not create agreement.");
      }

      const nextInviteLink = result.loan.inviteToken
        ? `${window.location.origin}/invite/${result.loan.inviteToken}`
        : null;

      setIsRecording(true);

      try {
        await createLoanAgreementOnSolana(result.loan);
        setCreatedMessage("Agreement created!");
      } catch (syncError) {
        console.error("Agreement saved, but secure proof failed.", syncError);
        setCreatedMessage("Agreement created! Secure proof can be retried later.");
      }

      setInviteLink(nextInviteLink);
      setAmount("");
      setReason("");
      setDueDate("");
      setBorrowerWallet("");
      onAgreementCreated?.();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create agreement.",
      );
    } finally {
      setIsRecording(false);
      setIsSubmitting(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) return;

    await navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1800);
  }

  return (
    <section
      className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgba(0,0,0,0.24)]"
      id="new-agreement"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text)]">
            New agreement
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Keep the terms simple and human.
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(34,197,94,0.12)] text-[var(--green)]">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={createAgreement}>
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            Borrower wallet address
          </span>
          <input
            className={inputClass}
            autoComplete="off"
            inputMode="text"
            placeholder="Enter their Solana wallet address"
            spellCheck={false}
            value={borrowerWallet}
            onChange={(event) => setBorrowerWallet(event.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <label className="grid gap-2 text-sm">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
              Amount
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--muted)]">
                ₹
              </span>
              <input
                className={`${inputClass} pl-8`}
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="500"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
              Due date
            </span>
            <input
              className={inputClass}
              min={today}
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            Purpose
          </span>
          <textarea
            className={`${inputClass} min-h-[96px] resize-none leading-6`}
            maxLength={128}
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Rent bridge, travel split, emergency help..."
          />
        </label>

        {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}

        {createdMessage ? (
          <div className="grid gap-3 rounded-[8px] border border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.08)] p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--green)]">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {createdMessage}
            </p>

            {inviteLink ? (
              <div className="grid gap-2">
                <p className="text-xs leading-5 text-[var(--muted)]">
                  Share this link with the borrower to let them accept.
                </p>
                <div className="flex min-w-0 items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--bg)] p-2">
                  <p className="min-w-0 flex-1 truncate text-xs text-[var(--text)]">
                    {inviteLink}
                  </p>
                  <button
                    aria-label="Copy invite link"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                    onClick={copyInviteLink}
                    type="button"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-[var(--green)]" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--green)] px-4 text-sm font-semibold text-black hover:bg-[#4ADE80] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {isRecording
            ? "Creating..."
            : isSubmitting
              ? "Creating..."
              : "Create agreement →"}
        </button>
      </form>
    </section>
  );
}
