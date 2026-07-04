"use client";

import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  type Transaction,
  type VersionedTransaction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { CheckCircle2, Loader2, Plus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { TRUST_ME_BRO_ANCHOR_IDL } from "@/lib/anchor-idl";

type Borrower = {
  id: string;
  username: string | null;
  walletAddress: string;
  createdAt: string;
};

type CreatedAgreement = {
  id: string;
  amount: number;
  reason: string;
  dueDate: string;
  status: "PENDING" | "ACCEPTED" | "REPAID" | "CANCELLED";
  txSignature: string | null;
  borrowerWalletAddress?: string;
  borrower: {
    username: string | null;
  };
};

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  signAndSendTransaction?<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: {
      preflightCommitment?: "processed" | "confirmed" | "finalized";
      skipPreflight?: boolean;
    },
  ): Promise<{ signature: string } | string>;
  signTransaction?<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T>;
};

type WindowWithPhantom = Window & {
  solana?: PhantomProvider;
};

type CreateAgreementFormProps = {
  onAgreementCreated?: () => void;
};

const PROGRAM_ID = new PublicKey(
  "62x4fhaFhshjbsMvvgP4oyTqiGRftqQGQLr5JMidWPXk",
);

const inputClass =
  "w-full rounded-[8px] border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] hover:border-zinc-700 focus:border-[var(--green)]";

function getNumericLoanId(loanId: string) {
  const maxSafeLoanId = 9_007_199_254_740_991;

  return Array.from(loanId).reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) % maxSafeLoanId;
  }, 7);
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
  const { connection } = useConnection();
  const today = new Date().toISOString().slice(0, 10);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [borrowerId, setBorrowerId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isLoadingBorrowers, setIsLoadingBorrowers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBorrowers() {
      setIsLoadingBorrowers(true);
      setError(null);

      try {
        const response = await fetch("/api/users/borrowers");

        if (!response.ok) {
          throw new Error("Could not load borrowers.");
        }

        const result = (await response.json()) as { borrowers: Borrower[] };

        if (isMounted) {
          setBorrowers(result.borrowers);
          setBorrowerId(result.borrowers[0]?.id ?? "");
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load borrowers.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingBorrowers(false);
        }
      }
    }

    loadBorrowers();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedBorrower = useMemo(
    () => borrowers.find((borrower) => borrower.id === borrowerId),
    [borrowers, borrowerId],
  );

  async function createLoanAgreementOnSolana(loan: CreatedAgreement) {
    const borrowerPubkey = getPublicKey(loan.borrowerWalletAddress);
    const phantomProvider = (window as WindowWithPhantom).solana;

    if (!borrowerPubkey) {
      throw new Error("Borrower is not ready.");
    }

    if (!phantomProvider?.isPhantom) {
      throw new Error("Wallet is not available.");
    }

    const connectedWallet = await phantomProvider.connect();
    const activePublicKey = new PublicKey(connectedWallet.publicKey.toBase58());
    const loanIdNum = getNumericLoanId(loan.id);
    const loanIdBuffer = Buffer.alloc(8);
    loanIdBuffer.writeBigUInt64LE(BigInt(loanIdNum));

    const [loanPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan"), activePublicKey.toBuffer(), loanIdBuffer],
      PROGRAM_ID,
    );

    const anchorWallet = {
      publicKey: activePublicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T) => tx,
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(
        txs: T[],
      ) => txs,
    };

    const providerForProgram = new AnchorProvider(connection, anchorWallet, {
      commitment: "confirmed",
      skipPreflight: false,
    });

    const program = new Program(TRUST_ME_BRO_ANCHOR_IDL, providerForProgram);
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
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash("confirmed")
    ).blockhash;

    let txSignature: string;

    if (phantomProvider.signAndSendTransaction) {
      const result = await phantomProvider.signAndSendTransaction(transaction, {
        preflightCommitment: "confirmed",
        skipPreflight: false,
      });
      txSignature = typeof result === "string" ? result : result.signature;
    } else if (phantomProvider.signTransaction) {
      const signedTransaction = await phantomProvider.signTransaction(transaction);
      txSignature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          preflightCommitment: "confirmed",
          skipPreflight: false,
        },
      );
    } else {
      throw new Error("Wallet signature is not available.");
    }

    await connection.confirmTransaction(txSignature, "confirmed");

    await fetch(`/api/loans/${loan.id}/signature`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txSignature }),
    });
  }

  async function createAgreement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedMessage(null);
    setIsSubmitting(true);
    setIsRecording(false);

    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerId,
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

      setIsRecording(true);

      try {
        await createLoanAgreementOnSolana(result.loan);
        setCreatedMessage("Agreement created.");
      } catch (syncError) {
        console.error("Agreement saved, but secure proof failed.", syncError);
        setCreatedMessage("Agreement saved. Secure proof can be retried later.");
      }

      setAmount("");
      setReason("");
      setDueDate("");
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
            Borrower
          </span>
          <select
            className={inputClass}
            disabled={isLoadingBorrowers || borrowers.length === 0}
            value={borrowerId}
            onChange={(event) => setBorrowerId(event.target.value)}
          >
            {isLoadingBorrowers ? (
              <option>Loading people</option>
            ) : borrowers.length > 0 ? (
              borrowers.map((borrower, index) => (
                <option key={borrower.id} value={borrower.id}>
                  {borrower.username ?? `Person ${index + 1}`}
                </option>
              ))
            ) : (
              <option>No borrowers available</option>
            )}
          </select>
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

        {selectedBorrower ? (
          <p className="text-xs text-[var(--muted)]">
            Creating with {selectedBorrower.username ?? "this person"}.
          </p>
        ) : null}

        {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}

        {createdMessage ? (
          <p className="flex items-center gap-2 text-sm text-[var(--green)]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {createdMessage}
          </p>
        ) : null}

        <button
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--green)] px-4 text-sm font-semibold text-black hover:bg-[#4ADE80] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting || isLoadingBorrowers || borrowers.length === 0}
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
