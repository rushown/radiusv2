"use strict";

const { ethers } = require("ethers");
const logger     = require("./logger");

// Minimal ABI — only the functions the backend needs to call
const LINKPAY_ABI = [
  "function getClaim(bytes32 claimId) external view returns (address creator, uint256 amount, uint256 expiresAt, bool claimed)",
  "function isClaimable(bytes32 claimId) external view returns (bool)",
  "function getCreatorClaims(address creator) external view returns (bytes32[])",
  "event ClaimCreated(bytes32 indexed claimId, address indexed creator, uint256 amount, uint256 expiresAt)",
  "event ClaimClaimed(bytes32 indexed claimId, address indexed recipient, uint256 amount)",
  "event ClaimReclaimed(bytes32 indexed claimId, address indexed creator, uint256 amount)",
];

let _provider = null;
let _contract = null;

function getProvider() {
  if (!_provider) {
    const rpcUrl = process.env.ARC_RPC_URL;
    if (!rpcUrl) throw new Error("ARC_RPC_URL environment variable is not set");
    _provider = new ethers.JsonRpcProvider(rpcUrl, {
      chainId: Number(process.env.ARC_CHAIN_ID || 5042002),
      name:    "arc-testnet",
    });
    logger.info(`RPC provider initialised: ${rpcUrl}`);
  }
  return _provider;
}

function getLinkPayContract() {
  if (!_contract) {
    const address = process.env.LINKPAY_CONTRACT_ADDRESS;
    if (!address || address === ethers.ZeroAddress) {
      throw new Error("LINKPAY_CONTRACT_ADDRESS environment variable is not set or is zero");
    }
    _contract = new ethers.Contract(address, LINKPAY_ABI, getProvider());
    logger.info(`LinkPay contract interface initialised at ${address}`);
  }
  return _contract;
}

/**
 * Wait for a transaction receipt with a timeout.
 */
async function waitForReceipt(txHash, timeoutMs = 60_000) {
  const provider = getProvider();
  return Promise.race([
    provider.waitForTransaction(txHash, 1),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Receipt timeout")), timeoutMs)
    ),
  ]);
}

module.exports = { getProvider, getLinkPayContract, waitForReceipt };
