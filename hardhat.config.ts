require("dotenv").config()
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
const { PRIVATE_KEY, GOERLI_API_KEY, ETHERSCAN_KEY } = process.env
const block1 = 7929752

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      forking: {
        url: `${GOERLI_API_KEY}`,
        blockNumber: block1
      }

    },
    goerli: {
      url: GOERLI_API_KEY,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    mumbai: {
      url: GOERLI_API_KEY,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  },

  etherscan: {
    apiKey: ETHERSCAN_KEY
  },

  mocha: {
    timeout: 100000000
  },
};

export default config;
