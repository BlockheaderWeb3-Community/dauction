import { time } from "@nomicfoundation/hardhat-network-helpers";
export const setTime = async (hours: number) => await time.latest() + (hours * 60 * 60)

