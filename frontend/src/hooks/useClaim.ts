import { useState, useCallback } from "react";
import {
  useWriteContract,
  useReadContract,
  usePublicClient,
} from "wagmi";
import {
  LINK_PAY_CONTRACT_ADDRESS,
  LINK_PAY_ABI,
  USDC_CONTRACT_ADDRESS,
  USDC_ABI,
} from "@/config/chain";

export type TxStatus =
  | "idle"
  | "approving"
  | "approval-pending"
  | "creating"
  | "tx-pending"
  | "confirmed"
  | "error";

// ---------- CREATE CLAIM ----------
export function useCreateClaim() {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const create = useCallback(
    async (
      claimId: `0x${string}`,
      amount: bigint,
      expiryTimestamp: bigint,
      owner: `0x${string}`
    ) => {
      setError(null);
      try {
        // Step 1: Approve USDC spend
        setStatus("approving");
        const allowanceData = await publicClient!.readContract({
          address: USDC_CONTRACT_ADDRESS,
          abi: USDC_ABI,
          functionName: "allowance",
          args: [owner, LINK_PAY_CONTRACT_ADDRESS],
        });

        if ((allowanceData as bigint) < amount) {
          const approveTx = await writeContractAsync({
            address: USDC_CONTRACT_ADDRESS,
            abi: USDC_ABI,
            functionName: "approve",
            args: [LINK_PAY_CONTRACT_ADDRESS, amount],
          });
          setStatus("approval-pending");
          await publicClient!.waitForTransactionReceipt({ hash: approveTx });
        }

        // Step 2: Create claim
        setStatus("creating");
        const hash = await writeContractAsync({
          address: LINK_PAY_CONTRACT_ADDRESS,
          abi: LINK_PAY_ABI,
          functionName: "createClaim",
          args: [claimId, amount, expiryTimestamp],
        });
        setTxHash(hash);
        setStatus("tx-pending");
        await publicClient!.waitForTransactionReceipt({ hash });
        setStatus("confirmed");
        return hash;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Transaction failed";
        setError(msg);
        setStatus("error");
        throw err;
      }
    },
    [writeContractAsync, publicClient]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTxHash(null);
  }, []);

  return { create, status, error, txHash, reset };
}

// ---------- CLAIM FUNDS ----------
export function useClaimFunds() {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const claimFunds = useCallback(
    async (claimId: `0x${string}`, secret: `0x${string}`) => {
      setError(null);
      try {
        setStatus("creating");
        const hash = await writeContractAsync({
          address: LINK_PAY_CONTRACT_ADDRESS,
          abi: LINK_PAY_ABI,
          functionName: "claim",
          args: [claimId, secret],
        });
        setTxHash(hash);
        setStatus("tx-pending");
        await publicClient!.waitForTransactionReceipt({ hash });
        setStatus("confirmed");
        return hash;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Claim transaction failed";
        setError(msg);
        setStatus("error");
        throw err;
      }
    },
    [writeContractAsync, publicClient]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTxHash(null);
  }, []);

  return { claimFunds, status, error, txHash, reset };
}

// ---------- RECLAIM FUNDS ----------
export function useReclaimFunds() {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const reclaim = useCallback(
    async (claimId: `0x${string}`) => {
      setError(null);
      try {
        setStatus("creating");
        const hash = await writeContractAsync({
          address: LINK_PAY_CONTRACT_ADDRESS,
          abi: LINK_PAY_ABI,
          functionName: "reclaim",
          args: [claimId],
        });
        setTxHash(hash);
        setStatus("tx-pending");
        await publicClient!.waitForTransactionReceipt({ hash });
        setStatus("confirmed");
        return hash;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Reclaim transaction failed";
        setError(msg);
        setStatus("error");
        throw err;
      }
    },
    [writeContractAsync, publicClient]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTxHash(null);
  }, []);

  return { reclaim, status, error, txHash, reset };
}

// ---------- GET CLAIM DETAILS (on-chain read) ----------
export function useOnChainClaim(claimId?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: LINK_PAY_CONTRACT_ADDRESS,
    abi: LINK_PAY_ABI,
    functionName: "getClaim",
    args: claimId ? [claimId] : undefined,
    query: { enabled: !!claimId },
  });

  type ClaimData = {
    amount: bigint;
    creator: `0x${string}`;
    claimedBy: `0x${string}`;
    expiryTimestamp: bigint;
    claimed: boolean;
    exists: boolean;
  };

  return {
    claim: data as ClaimData | undefined,
    isLoading,
    refetch,
  };
}
