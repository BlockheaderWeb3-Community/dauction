import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
export const setTime = async (hours: number = 0) => await time.latest() + (hours * 60 * 60)

export const setHour = async () => await time.latest() + (60 * 60)

export const increaseBlockTimestamp = async (hours: number) => {
  const provider = ethers.provider
  await provider.send("evm_increaseTime", [hours * 3600]);
  await provider.send("evm_mine", []);
};
