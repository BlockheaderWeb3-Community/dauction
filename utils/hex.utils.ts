// import { ethers } from hardhat;
import ethers from "ethers"

// num to bytes32 
const hexify = (payload: number) => 
    ethers.utils.hexZeroPad(ethers.utils.hexlify(payload), 32)



// decode bytes32
const decodeBidHash = (x: string, y: string) => 
    ethers.utils.solidityKeccak256(["address", "bytes32"], [x, y])



const testDecodeHash = (payload: string) => 
    ethers.utils.solidityKeccak256(["bytes32"], [payload])



const stripHexPrefix = (hex: string) => {
    if (!ethers.utils.isHexString(hex)) {
        throw Error(`Expected valid hex string, got: "${hex}"`)
    }
    return hex.replace('0x', '')
}


const addHexPrefix = (hex: string) => 
    hex.startsWith('0x') ? hex : `0x${hex}`



const numToBytes32 = (num: number) => {
    const hexifiedValue = hexify(num)
    const strippedNum = stripHexPrefix(hexifiedValue)
    if (strippedNum.length > 32 * 2) {
        throw Error(
            'Cannot convert number to bytes32 format, value is greater than maximum bytes32 value',
        )
    }
    return addHexPrefix(strippedNum.padStart(32 * 2, '0'))
}

const concatParams = (bidAmount: ethers.ethers.utils.BytesLike, salt: number) => 
     ethers.utils.concat([
        ethers.utils.zeroPad(bidAmount, 32),
        ethers.utils.arrayify(salt),
    ])

// convert num to salt
const createSalt = (num: number) =>     // recommended to have random 
    ethers.utils.keccak256(ethers.utils.arrayify(num));


// function to hash bidders bidvalue - hash of bid value + salt
const hashCommitmentParams = (bidAmount: ethers.ethers.utils.BytesLike, salt: number) =>
    ethers.utils.keccak256(concatParams(bidAmount, salt));



export { hexify, decodeBidHash, numToBytes32, testDecodeHash, hashCommitmentParams, createSalt };
