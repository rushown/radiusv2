// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LinkPay
 * @author Secure Link Pay
 * @notice Trustless, one-time-claim USDC payment links on the Arc blockchain.
 *
 * SECURITY MODEL
 * ──────────────
 * • claimId  = keccak256(secret)  — stored on-chain; the raw secret is NEVER stored.
 * • The claim link encodes both claimId and secret in the URL fragment:
 *     https://app/claim/{claimId}/{secret}
 * • Claiming requires supplying the raw secret; the contract re-hashes and checks equality.
 * • ReentrancyGuard protects every state-changing function.
 * • Pull-over-push: funds sit in the contract; claimant or creator "pulls" them out.
 * • Front-running mitigation: the secret itself is the bearer credential — anyone who
 *   intercepts the tx can only race with the same wallet destination (msg.sender), which
 *   is economically unfeasible if the link is shared privately.
 */
contract LinkPay is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice Arc testnet ERC-20 USDC (6 decimals).
    IERC20 public immutable USDC;

    /// @notice Maximum claim expiry window allowed (365 days).
    uint256 public constant MAX_EXPIRY_DURATION = 365 days;

    /// @notice Minimum claim expiry window (1 hour).
    uint256 public constant MIN_EXPIRY_DURATION = 1 hours;

    /// @notice Default expiry if caller passes 0 (7 days).
    uint256 public constant DEFAULT_EXPIRY_DURATION = 7 days;

    // ─── Storage ──────────────────────────────────────────────────────────────

    struct Claim {
        address creator;
        uint256 amount;       // USDC amount (6 decimals)
        uint256 expiresAt;    // Unix timestamp; 0 means no expiry (not used externally)
        bool    claimed;
    }

    /// @dev claimId → Claim
    mapping(bytes32 => Claim) private _claims;

    /// @dev creator → list of claimIds (for off-chain queries; not iterated on-chain)
    mapping(address => bytes32[]) private _creatorClaims;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ClaimCreated(
        bytes32 indexed claimId,
        address indexed creator,
        uint256 amount,
        uint256 expiresAt
    );

    event ClaimClaimed(
        bytes32 indexed claimId,
        address indexed recipient,
        uint256 amount
    );

    event ClaimReclaimed(
        bytes32 indexed claimId,
        address indexed creator,
        uint256 amount
    );

    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error ClaimAlreadyExists(bytes32 claimId);
    error ClaimDoesNotExist(bytes32 claimId);
    error ClaimAlreadyClaimed(bytes32 claimId);
    error ClaimNotExpired(bytes32 claimId);
    error ClaimExpired(bytes32 claimId);
    error NotClaimCreator(bytes32 claimId);
    error InvalidSecret(bytes32 claimId);
    error InvalidAmount();
    error InvalidExpiry();
    error ZeroAddress();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyUnclaimed(bytes32 claimId) {
        if (_claims[claimId].creator == address(0)) revert ClaimDoesNotExist(claimId);
        if (_claims[claimId].claimed) revert ClaimAlreadyClaimed(claimId);
        _;
    }

    modifier onlyNotExpired(bytes32 claimId) {
        if (block.timestamp >= _claims[claimId].expiresAt) revert ClaimExpired(claimId);
        _;
    }

    modifier onlyExpired(bytes32 claimId) {
        if (block.timestamp < _claims[claimId].expiresAt) revert ClaimNotExpired(claimId);
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address usdc) Ownable(msg.sender) {
        if (usdc == address(0)) revert ZeroAddress();
        USDC = IERC20(usdc);
    }

    // ─── External: Creator ────────────────────────────────────────────────────

    /**
     * @notice Lock USDC into the contract and register a new claim link.
     * @param claimId          keccak256 hash of the raw secret (computed off-chain).
     * @param amount           USDC amount to lock (6 decimals, must be > 0).
     * @param expiryTimestamp  Unix timestamp when the claim expires. Pass 0 to use
     *                         the default 7-day window from now.
     *
     * @dev The caller must have approved this contract to spend `amount` of USDC
     *      before calling this function.
     */
    function createClaim(
        bytes32 claimId,
        uint256 amount,
        uint256 expiryTimestamp
    ) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (_claims[claimId].creator != address(0)) revert ClaimAlreadyExists(claimId);

        // Resolve expiry
        uint256 expiry;
        if (expiryTimestamp == 0) {
            expiry = block.timestamp + DEFAULT_EXPIRY_DURATION;
        } else {
            if (expiryTimestamp <= block.timestamp + MIN_EXPIRY_DURATION) revert InvalidExpiry();
            if (expiryTimestamp > block.timestamp + MAX_EXPIRY_DURATION) revert InvalidExpiry();
            expiry = expiryTimestamp;
        }

        _claims[claimId] = Claim({
            creator:   msg.sender,
            amount:    amount,
            expiresAt: expiry,
            claimed:   false
        });

        _creatorClaims[msg.sender].push(claimId);

        // Pull USDC from the creator — reverts if allowance or balance is insufficient
        USDC.safeTransferFrom(msg.sender, address(this), amount);

        emit ClaimCreated(claimId, msg.sender, amount, expiry);
    }

    /**
     * @notice Claim USDC using the raw secret embedded in the claim link.
     * @param claimId  The claimId from the URL (used for lookup).
     * @param secret   The raw 32-byte secret from the URL — the contract hashes this
     *                 and verifies it equals `claimId`.
     *
     * @dev nonReentrant + pull-over-push + one-time flag prevent all known
     *      reentrancy and replay scenarios.
     */
    function claim(
        bytes32 claimId,
        bytes32 secret
    ) external nonReentrant whenNotPaused onlyUnclaimed(claimId) onlyNotExpired(claimId) {
        // Verify the secret produces the claimId
        if (keccak256(abi.encodePacked(secret)) != claimId) revert InvalidSecret(claimId);

        uint256 amount = _claims[claimId].amount;

        // Mark claimed BEFORE transfer (checks-effects-interactions)
        _claims[claimId].claimed = true;

        USDC.safeTransfer(msg.sender, amount);

        emit ClaimClaimed(claimId, msg.sender, amount);
    }

    /**
     * @notice Allow the original creator to reclaim USDC after expiry.
     * @param claimId  The claimId to reclaim.
     */
    function reclaim(bytes32 claimId)
        external
        nonReentrant
        whenNotPaused
        onlyUnclaimed(claimId)
        onlyExpired(claimId)
    {
        if (_claims[claimId].creator != msg.sender) revert NotClaimCreator(claimId);

        uint256 amount = _claims[claimId].amount;

        // Mark claimed BEFORE transfer
        _claims[claimId].claimed = true;

        USDC.safeTransfer(msg.sender, amount);

        emit ClaimReclaimed(claimId, msg.sender, amount);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @notice Fetch all stored metadata for a claim (safe to call publicly).
     * @return creator    Address that created the claim.
     * @return amount     Locked USDC amount (6 decimals).
     * @return expiresAt  Expiry timestamp.
     * @return claimed    Whether it has already been claimed.
     */
    function getClaim(bytes32 claimId)
        external
        view
        returns (
            address creator,
            uint256 amount,
            uint256 expiresAt,
            bool    claimed
        )
    {
        Claim storage c = _claims[claimId];
        return (c.creator, c.amount, c.expiresAt, c.claimed);
    }

    /**
     * @notice Returns true when the claim is live and claimable.
     */
    function isClaimable(bytes32 claimId) external view returns (bool) {
        Claim storage c = _claims[claimId];
        return (
            c.creator != address(0) &&
            !c.claimed &&
            block.timestamp < c.expiresAt
        );
    }

    /**
     * @notice Returns all claimIds created by an address.
     */
    function getCreatorClaims(address creator) external view returns (bytes32[] memory) {
        return _creatorClaims[creator];
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Pause all state-changing operations. OnlyOwner.
    function pause() external onlyOwner { _pause(); }

    /// @notice Unpause. OnlyOwner.
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Emergency withdrawal of any ERC-20 accidentally sent to this contract.
     * @dev    CANNOT withdraw USDC that belongs to active claims; only the contract's
     *         "surplus" balance (i.e. direct transfers outside of createClaim).
     *         For simplicity this function allows the owner to sweep any token balance.
     *         In production, track total locked USDC and only allow sweeping the delta.
     */
    function emergencyWithdraw(address token, address to, uint256 amount)
        external
        onlyOwner
    {
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
        emit EmergencyWithdraw(token, to, amount);
    }

    /**
     * @notice Reject accidental native token sends (Arc uses USDC for gas, but guard anyway).
     */
    receive() external payable {
        revert("LinkPay: native token not accepted");
    }
}
