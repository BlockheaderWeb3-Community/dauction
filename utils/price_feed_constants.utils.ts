import { ethers } from "hardhat";
const WETH_USD =
    "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"; // ETH/USD Aggregator Address
const WBTC_USD =
    "0xA39434A63A52E749F02807ae27335515BA4b07F7"; // WBTC/USD Aggregator Address

const LINK_USD = "0x48731cF7e84dc94C5f84577882c14Be11a5B7456";  // LINK/USD Aggregator Address

const ZERO_ADDRESS = ethers.constants.AddressZero;

const MAX_UINT256 = ethers.constants.MaxUint256;



export { WETH_USD, WBTC_USD, LINK_USD, ZERO_ADDRESS, MAX_UINT256 }
