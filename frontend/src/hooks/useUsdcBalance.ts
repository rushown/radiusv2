import { useReadContract } from "wagmi";
import { USDC_CONTRACT_ADDRESS, USDC_ABI } from "@/config/chain";
import { formatUsdc } from "@/utils/crypto";

export function useUsdcBalance(address?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  return {
    raw: data as bigint | undefined,
    formatted: data !== undefined ? formatUsdc(data as bigint) : undefined,
    isLoading,
    refetch,
  };
}
