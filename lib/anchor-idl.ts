import type { Idl } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import trustMeBroIdl from "@/lib/idl/trust_me_bro.json";

const INSTRUCTION_DISCRIMINATORS: Record<string, number[]> = {
  createLoan: [166, 131, 118, 219, 138, 218, 206, 140],
  acceptLoan: [115, 234, 176, 73, 152, 3, 37, 221],
  repayLoan: [224, 93, 144, 77, 61, 17, 137, 54],
  cancelLoan: [214, 125, 161, 106, 51, 186, 69, 148],
};

const LOAN_ACCOUNT_DISCRIMINATOR = [223, 49, 62, 167, 247, 182, 239, 60];

function normalizeFieldType(type: unknown): unknown {
  if (type === "publicKey") {
    return "pubkey";
  }

  if (typeof type === "object" && type !== null && "defined" in type) {
    const defined = (type as { defined: string | { name: string } }).defined;
    const name = typeof defined === "string" ? defined : defined.name;

    return {
      defined: {
        name: name === "LoanStatus" ? "loanStatus" : name,
      },
    };
  }

  return type;
}

export const TRUST_ME_BRO_ANCHOR_IDL = {
  ...trustMeBroIdl,
  address: trustMeBroIdl.metadata.address,
  instructions: trustMeBroIdl.instructions.map((instruction) => ({
    ...instruction,
    discriminator: INSTRUCTION_DISCRIMINATORS[instruction.name],
    accounts: instruction.accounts.map((account) => ({
      name: account.name,
      writable: account.isMut,
      signer: account.isSigner,
      ...(account.name === "systemProgram"
        ? { address: SystemProgram.programId.toBase58() }
        : {}),
    })),
  })),
  accounts: [
    {
      name: "loanAccount",
      discriminator: LOAN_ACCOUNT_DISCRIMINATOR,
    },
  ],
  types: [
    {
      name: "loanAccount",
      type: {
        kind: "struct",
        fields: trustMeBroIdl.accounts[0].type.fields.map((field) => ({
          ...field,
          type: normalizeFieldType(field.type),
        })),
      },
    },
    {
      name: "loanStatus",
      type: trustMeBroIdl.types[0].type,
    },
  ],
} as unknown as Idl;

