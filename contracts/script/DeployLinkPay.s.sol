// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/LinkPay.sol";

/**
 * @title DeployLinkPay
 * @notice Deploys the LinkPay contract to the Arc testnet.
 *
 * Usage:
 *   forge script script/DeployLinkPay.s.sol \
 *     --rpc-url https://rpc.testnet.arc.network \
 *     --broadcast \
 *     --verify \
 *     --verifier-url https://testnet.arcscan.app/api \
 *     -vvvv
 *
 * Environment variables required:
 *   DEPLOYER_PRIVATE_KEY  — private key of the deployer wallet (never commit this)
 *   USDC_ADDRESS          — USDC ERC-20 contract on Arc testnet
 *                           (default: 0x3600000000000000000000000000000000000000)
 */
contract DeployLinkPay is Script {
    // Arc testnet USDC ERC-20 (6 decimals)
    address constant DEFAULT_USDC = 0x3600000000000000000000000000000000000000;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address usdcAddress = vm.envOr("USDC_ADDRESS", DEFAULT_USDC);

        vm.startBroadcast(deployerKey);

        LinkPay linkPay = new LinkPay(usdcAddress);

        vm.stopBroadcast();

        console.log("=================================================");
        console.log("  LinkPay deployed at:", address(linkPay));
        console.log("  USDC address used:  ", usdcAddress);
        console.log("  Chain ID:           ", block.chainid);
        console.log("=================================================");
        console.log("  Next step: verify on https://testnet.arcscan.app");
        console.log("=================================================");
    }
}
