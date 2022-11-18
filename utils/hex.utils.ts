import { ethers } from "hardhat";
import { BigNumberish } from "starknet/dist/utils/number";


// number to bytes32 
const hexify = (payload: number) =>
    ethers.utils.hexZeroPad(ethers.utils.hexlify(payload), 32)

// convert num to salt
const createSalt = (num: string | number) => {
    const salt = ethers.utils.keccak256(ethers.utils.arrayify(num));
    return salt
}

// function to hash bidders bidvalue - hash of bid value + salt
const hashCommitmentParams = (bidAmount: BigNumberish, salt: string | number) =>
    ethers.utils.solidityKeccak256(["uint256", "bytes32"], [bidAmount, salt]);

// utility to test matching bid commitment hashes
const unveilHashCommitment = (bidder: string, bidCommitment: string, bidToken: string) =>
 ethers.utils.solidityKeccak256(["address", "bytes32", "address"], [bidder, bidCommitment, bidToken]);


const ZERO_BYTES_32 = ethers.constants.HashZero;

export { hexify, hashCommitmentParams, createSalt, ZERO_BYTES_32, unveilHashCommitment };
