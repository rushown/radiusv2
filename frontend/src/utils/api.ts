import axios from "axios";
import { API_BASE_URL } from "@/config/chain";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

export interface ClaimRecord {
  claimId: string;
  amount: string; // human-readable USDC
  amountRaw: string; // raw bigint string
  creatorAddress: string;
  createdAt: number;
  expiresAt: number;
  claimedAt?: number;
  claimedBy?: string;
  status: "pending" | "claimed" | "expired" | "reclaimed";
}

export interface CreateClaimPayload {
  claimId: string;
  amount: string;
  amountRaw: string;
  creatorAddress: string;
  expiresAt: number;
  txHash: string;
}

export const api = {
  async createClaim(payload: CreateClaimPayload): Promise<ClaimRecord> {
    const { data } = await apiClient.post<ClaimRecord>("/claims", payload);
    return data;
  },

  async getClaim(claimId: string): Promise<ClaimRecord | null> {
    try {
      const { data } = await apiClient.get<ClaimRecord>(`/claims/${claimId}`);
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return null;
      throw err;
    }
  },

  async getUserClaims(address: string): Promise<ClaimRecord[]> {
    const { data } = await apiClient.get<ClaimRecord[]>(
      `/claims/user/${address}`
    );
    return data;
  },

  async verifyClaim(
    claimId: string,
    secret: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const { data } = await apiClient.post<{ valid: boolean; reason?: string }>(
      "/claims/verify",
      { claimId, secret }
    );
    return data;
  },

  async markClaimed(
    claimId: string,
    claimedBy: string,
    txHash: string
  ): Promise<void> {
    await apiClient.patch(`/claims/${claimId}/claimed`, { claimedBy, txHash });
  },
};

export default api;
