import { ethers } from "hardhat";
const WETH_USD =
    "0x0715A7794a1dc8e42615F059dD6e406A6594651A"; // Mumbai ETH/USD Aggregator Address

const WBTC_USD =
    "0x007A22900a3B98143368Bd5906f8E17e9867581b"; // Mumbai WBTC/USD Aggregator Address 

const LINK_USD = "0x1C2252aeeD50e0c9B64bDfF2735Ee3C932F5C408";  // Mumbai LINK/USD Aggregator Address

const ZERO_ADDRESS = ethers.constants.AddressZero;

const MAX_UINT256 = ethers.constants.MaxUint256;



export { WETH_USD, WBTC_USD, LINK_USD, ZERO_ADDRESS, MAX_UINT256 }
