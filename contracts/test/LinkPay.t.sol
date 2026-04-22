// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/LinkPay.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// ─── Mock USDC (6 decimals) ───────────────────────────────────────────────────
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function decimals() public pure override returns (uint8) { return 6; }

    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────
contract LinkPayTest is Test {
    LinkPay   public linkPay;
    MockUSDC  public usdc;

    address constant ALICE   = address(0xA11CE);
    address constant BOB     = address(0xB0B);
    address constant CHARLIE = address(0xC4A);
    address constant OWNER   = OWNER(0xC4A);

    uint256 constant ONE_USDC    = 1e6;   // 1 USDC (6 decimals)
    uint256 constant HUNDRED_USDC = 100e6;

    bytes32 constant RAW_SECRET  = keccak256("test_secret_value_1");
    bytes32          CLAIM_ID;

    // ─── Setup ────────────────────────────────────────────────────────────────

    function setUp() public {
        vm.startPrank(OWNER);
        usdc    = new MockUSDC();
        linkPay = new LinkPay(address(usdc));
        vm.stopPrank();

        // CLAIM_ID is the hash of the secret (mirrors on-chain computation)
        CLAIM_ID = keccak256(abi.encodePacked(RAW_SECRET));

        // Fund actors
        usdc.mint(ALICE,   HUNDRED_USDC * 10);
        usdc.mint(BOB,     HUNDRED_USDC);
        usdc.mint(CHARLIE, HUNDRED_USDC);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function _aliceCreateClaim(
        bytes32 claimId,
        uint256 amount,
        uint256 expiry
    ) internal {
        vm.startPrank(ALICE);
        usdc.approve(address(linkPay), amount);
        linkPay.createClaim(claimId, amount, expiry);
        vm.stopPrank();
    }

    function _defaultExpiry() internal view returns (uint256) {
        return block.timestamp + 7 days;
    }

    // ─── CreateClaim ──────────────────────────────────────────────────────────

    function test_CreateClaim_Success() public {
        uint256 aliceBalBefore = usdc.balanceOf(ALICE);
        uint256 contractBalBefore = usdc.balanceOf(address(linkPay));

        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        (address creator, uint256 amount, uint256 expiresAt, bool claimed) =
            linkPay.getClaim(CLAIM_ID);

        assertEq(creator, ALICE,         "creator mismatch");
        assertEq(amount, HUNDRED_USDC,   "amount mismatch");
        assertGt(expiresAt, block.timestamp, "expiry must be in future");
        assertFalse(claimed,             "should not be claimed yet");

        assertEq(usdc.balanceOf(ALICE),          aliceBalBefore - HUNDRED_USDC);
        assertEq(usdc.balanceOf(address(linkPay)), contractBalBefore + HUNDRED_USDC);
    }

    function test_CreateClaim_EmitsEvent() public {
        uint256 expiry = _defaultExpiry();

        vm.startPrank(ALICE);
        usdc.approve(address(linkPay), HUNDRED_USDC);

        vm.expectEmit(true, true, false, true);
        emit LinkPay.ClaimCreated(CLAIM_ID, ALICE, HUNDRED_USDC, expiry);

        linkPay.createClaim(CLAIM_ID, HUNDRED_USDC, expiry);
        vm.stopPrank();
    }

    function test_CreateClaim_DefaultExpiry_WhenZeroPassed() public {
        vm.startPrank(ALICE);
        usdc.approve(address(linkPay), ONE_USDC);
        linkPay.createClaim(CLAIM_ID, ONE_USDC, 0);
        vm.stopPrank();

        (, , uint256 expiresAt, ) = linkPay.getClaim(CLAIM_ID);
        assertApproxEqAbs(expiresAt, block.timestamp + 7 days, 5, "default expiry wrong");
    }

    function test_CreateClaim_Revert_ZeroAmount() public {
        vm.startPrank(ALICE);
        usdc.approve(address(linkPay), 0);
        vm.expectRevert(LinkPay.InvalidAmount.selector);
        linkPay.createClaim(CLAIM_ID, 0, _defaultExpiry());
        vm.stopPrank();
    }

    function test_CreateClaim_Revert_DuplicateClaimId() public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        vm.startPrank(ALICE);
        usdc.approve(address(linkPay), HUNDRED_USDC);
        vm.expectRevert(abi.encodeWithSelector(LinkPay.ClaimAlreadyExists.selector, CLAIM_ID));
        linkPay.createClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());
        vm.stopPrank();
    }

    function test_CreateClaim_Revert_ExpiryTooSoon() public {
        uint256 badExpiry = block.timestamp + 30 minutes; // less than MIN_EXPIRY_DURATION (1 hr)
        vm.startPrank(ALICE);
        usdc.approve(address(linkPay), ONE_USDC);
        vm.expectRevert(LinkPay.InvalidExpiry.selector);
        linkPay.createClaim(CLAIM_ID, ONE_USDC, badExpiry);
        vm.stopPrank();
    }

    function test_CreateClaim_Revert_ExpiryTooFar() public {
        uint256 badExpiry = block.timestamp + 400 days;
        vm.startPrank(ALICE);
        usdc.approve(address(linkPay), ONE_USDC);
        vm.expectRevert(LinkPay.InvalidExpiry.selector);
        linkPay.createClaim(CLAIM_ID, ONE_USDC, badExpiry);
        vm.stopPrank();
    }

    function test_CreateClaim_Revert_InsufficientAllowance() public {
        vm.startPrank(ALICE);
        usdc.approve(address(linkPay), ONE_USDC); // approve less than amount
        vm.expectRevert();
        linkPay.createClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());
        vm.stopPrank();
    }

    // ─── Claim ────────────────────────────────────────────────────────────────

    function test_Claim_Success() public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        uint256 bobBalBefore = usdc.balanceOf(BOB);

        vm.prank(BOB);
        linkPay.claim(CLAIM_ID, RAW_SECRET);

        assertEq(usdc.balanceOf(BOB), bobBalBefore + HUNDRED_USDC, "Bob should receive USDC");
        assertEq(usdc.balanceOf(address(linkPay)), 0, "Contract should be empty");

        (, , , bool claimed) = linkPay.getClaim(CLAIM_ID);
        assertTrue(claimed, "Claim should be marked as claimed");
    }

    function test_Claim_EmitsEvent() public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        vm.expectEmit(true, true, false, true);
        emit LinkPay.ClaimClaimed(CLAIM_ID, BOB, HUNDRED_USDC);

        vm.prank(BOB);
        linkPay.claim(CLAIM_ID, RAW_SECRET);
    }

    function test_Claim_AnyoneCanClaim_WithCorrectSecret() public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        uint256 charlieBalBefore = usdc.balanceOf(CHARLIE);

        vm.prank(CHARLIE);
        linkPay.claim(CLAIM_ID, RAW_SECRET);

        assertEq(usdc.balanceOf(CHARLIE), charlieBalBefore + HUNDRED_USDC);
    }

    // ─── CannotClaimTwice ─────────────────────────────────────────────────────

    function test_CannotClaimTwice() public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        vm.prank(BOB);
        linkPay.claim(CLAIM_ID, RAW_SECRET);

        // Second claim attempt must revert
        vm.expectRevert(
            abi.encodeWithSelector(LinkPay.ClaimAlreadyClaimed.selector, CLAIM_ID)
        );
        vm.prank(CHARLIE);
        linkPay.claim(CLAIM_ID, RAW_SECRET);
    }

    function test_Claim_Revert_WrongSecret() public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        bytes32 wrongSecret = keccak256("wrong_secret");

        vm.expectRevert(
            abi.encodeWithSelector(LinkPay.InvalidSecret.selector, CLAIM_ID)
        );
        vm.prank(BOB);
        linkPay.claim(CLAIM_ID, wrongSecret);
    }

    function test_Claim_Revert_AfterExpiry() public {
        uint256 expiry = block.timestamp + 2 hours;
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, expiry);

        // Warp past expiry
        vm.warp(expiry + 1);

        vm.expectRevert(
            abi.encodeWithSelector(LinkPay.ClaimExpired.selector, CLAIM_ID)
        );
        vm.prank(BOB);
        linkPay.claim(CLAIM_ID, RAW_SECRET);
    }

    function test_Claim_Revert_NonExistentClaim() public {
        bytes32 nonExistentId = keccak256("non_existent");
        vm.expectRevert(
            abi.encodeWithSelector(LinkPay.ClaimDoesNotExist.selector, nonExistentId)
        );
        vm.prank(BOB);
        linkPay.claim(nonExistentId, RAW_SECRET);
    }

    // ─── CannotReclaimBeforeExpiry ────────────────────────────────────────────

    function test_CannotReclaimBeforeExpiry() public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        // Try to reclaim before expiry
        vm.expectRevert(
            abi.encodeWithSelector(LinkPay.ClaimNotExpired.selector, CLAIM_ID)
        );
        vm.prank(ALICE);
        linkPay.reclaim(CLAIM_ID);
    }

    function test_Reclaim_Success_AfterExpiry() public {
        uint256 expiry = block.timestamp + 2 hours;
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, expiry);

        uint256 aliceBalBefore = usdc.balanceOf(ALICE);

        vm.warp(expiry + 1);

        vm.prank(ALICE);
        linkPay.reclaim(CLAIM_ID);

        assertEq(usdc.balanceOf(ALICE), aliceBalBefore + HUNDRED_USDC, "Alice should get funds back");

        (, , , bool claimed) = linkPay.getClaim(CLAIM_ID);
        assertTrue(claimed, "should be marked claimed after reclaim");
    }

    function test_Reclaim_EmitsEvent() public {
        uint256 expiry = block.timestamp + 2 hours;
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, expiry);

        vm.warp(expiry + 1);

        vm.expectEmit(true, true, false, true);
        emit LinkPay.ClaimReclaimed(CLAIM_ID, ALICE, HUNDRED_USDC);

        vm.prank(ALICE);
        linkPay.reclaim(CLAIM_ID);
    }

    // ─── OnlyCreatorCanReclaim ────────────────────────────────────────────────

    function test_OnlyCreatorCanReclaim() public {
        uint256 expiry = block.timestamp + 2 hours;
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, expiry);

        vm.warp(expiry + 1);

        // Bob (not creator) tries to reclaim
        vm.expectRevert(
            abi.encodeWithSelector(LinkPay.NotClaimCreator.selector, CLAIM_ID)
        );
        vm.prank(BOB);
        linkPay.reclaim(CLAIM_ID);
    }

    function test_Reclaim_Revert_AlreadyClaimed() public {
        uint256 expiry = block.timestamp + 2 hours;
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, expiry);

        // Bob claims first
        vm.prank(BOB);
        linkPay.claim(CLAIM_ID, RAW_SECRET);

        // Alice tries to reclaim after expiry (already claimed)
        vm.warp(expiry + 1);
        vm.expectRevert(
            abi.encodeWithSelector(LinkPay.ClaimAlreadyClaimed.selector, CLAIM_ID)
        );
        vm.prank(ALICE);
        linkPay.reclaim(CLAIM_ID);
    }

    // ─── isClaimable View ─────────────────────────────────────────────────────

    function test_IsClaimable_True_WhenActive() public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());
        assertTrue(linkPay.isClaimable(CLAIM_ID));
    }

    function test_IsClaimable_False_AfterClaimed() public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());
        vm.prank(BOB);
        linkPay.claim(CLAIM_ID, RAW_SECRET);
        assertFalse(linkPay.isClaimable(CLAIM_ID));
    }

    function test_IsClaimable_False_AfterExpiry() public {
        uint256 expiry = block.timestamp + 2 hours;
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, expiry);
        vm.warp(expiry + 1);
        assertFalse(linkPay.isClaimable(CLAIM_ID));
    }

    function test_IsClaimable_False_NonExistent() public {
        assertFalse(linkPay.isClaimable(keccak256("ghost")));
    }

    // ─── GetCreatorClaims ─────────────────────────────────────────────────────

    function test_GetCreatorClaims() public {
        bytes32 secret2 = keccak256("test_secret_value_2");
        bytes32 claimId2 = keccak256(abi.encodePacked(secret2));

        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        vm.startPrank(ALICE);
        usdc.approve(address(linkPay), HUNDRED_USDC);
        linkPay.createClaim(claimId2, HUNDRED_USDC, _defaultExpiry());
        vm.stopPrank();

        bytes32[] memory ids = linkPay.getCreatorClaims(ALICE);
        assertEq(ids.length, 2);
        assertEq(ids[0], CLAIM_ID);
        assertEq(ids[1], claimId2);
    }

    // ─── Pause / Unpause ──────────────────────────────────────────────────────

    function test_Pause_BlocksCreateClaim() public {
        vm.prank(OWNER);
        linkPay.pause();

        vm.startPrank(ALICE);
        usdc.approve(address(linkPay), HUNDRED_USDC);
        vm.expectRevert();
        linkPay.createClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());
        vm.stopPrank();
    }

    function test_Pause_BlocksClaim() public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        vm.prank(OWNER);
        linkPay.pause();

        vm.expectRevert();
        vm.prank(BOB);
        linkPay.claim(CLAIM_ID, RAW_SECRET);
    }

    function test_Unpause_ResumesOperations() public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        vm.prank(OWNER);
        linkPay.pause();

        vm.prank(OWNER);
        linkPay.unpause();

        vm.prank(BOB);
        linkPay.claim(CLAIM_ID, RAW_SECRET);

        assertEq(usdc.balanceOf(BOB), HUNDRED_USDC * 2);
    }

    function test_Pause_OnlyOwner() public {
        vm.expectRevert();
        vm.prank(ALICE);
        linkPay.pause();
    }

    // ─── EmergencyWithdraw ────────────────────────────────────────────────────

    function test_EmergencyWithdraw_OnlyOwner() public {
        // Mint directly to contract (simulating accidental transfer)
        usdc.mint(address(linkPay), ONE_USDC);

        vm.prank(OWNER);
        linkPay.emergencyWithdraw(address(usdc), OWNER, ONE_USDC);

        assertEq(usdc.balanceOf(OWNER), ONE_USDC);
    }

    function test_EmergencyWithdraw_Revert_NonOwner() public {
        usdc.mint(address(linkPay), ONE_USDC);

        vm.expectRevert();
        vm.prank(ALICE);
        linkPay.emergencyWithdraw(address(usdc), ALICE, ONE_USDC);
    }

    // ─── Receive / Native tokens ──────────────────────────────────────────────

    function test_Receive_Revert_NativeTransfer() public {
        vm.deal(BOB, 1 ether);
        vm.expectRevert();
        vm.prank(BOB);
        address(linkPay).call{value: 1 ether}("");    }

    // ─── Fuzz Tests ───────────────────────────────────────────────────────────

    function testFuzz_CreateClaim_AnyAmountAboveZero(uint256 amount) public {
        amount = bound(amount, 1, HUNDRED_USDC * 100);
        usdc.mint(ALICE, amount);

        bytes32 fuzzSecret = keccak256(abi.encodePacked(amount, "fuzz"));
        bytes32 fuzzClaimId = keccak256(abi.encodePacked(fuzzSecret));

        vm.startPrank(ALICE);
        usdc.approve(address(linkPay), amount);
        linkPay.createClaim(fuzzClaimId, amount, _defaultExpiry());
        vm.stopPrank();

        (, uint256 storedAmount, , ) = linkPay.getClaim(fuzzClaimId);
        assertEq(storedAmount, amount);
    }

    function testFuzz_Claim_WrongSecret_AlwaysReverts(bytes32 badSecret) public {
        _aliceCreateClaim(CLAIM_ID, HUNDRED_USDC, _defaultExpiry());

        // If badSecret accidentally hashes to CLAIM_ID, skip
        vm.assume(keccak256(abi.encodePacked(badSecret)) != CLAIM_ID);

        vm.expectRevert(
            abi.encodeWithSelector(LinkPay.InvalidSecret.selector, CLAIM_ID)
        );
        vm.prank(BOB);
        linkPay.claim(CLAIM_ID, badSecret);
    }

    function testFuzz_MultipleIndependentClaims(uint8 n) public {
        n = uint8(bound(uint256(n), 1, 20));

        for (uint8 i = 0; i < n; i++) {
            bytes32 s  = keccak256(abi.encodePacked("secret", i));
            bytes32 id = keccak256(abi.encodePacked(s));
            usdc.mint(ALICE, ONE_USDC);

            vm.startPrank(ALICE);
            usdc.approve(address(linkPay), ONE_USDC);
            linkPay.createClaim(id, ONE_USDC, _defaultExpiry());
            vm.stopPrank();

            vm.prank(BOB);
            linkPay.claim(id, s);
        }

        assertEq(usdc.balanceOf(address(linkPay)), 0, "Contract should be empty after all claims");
    }
}
