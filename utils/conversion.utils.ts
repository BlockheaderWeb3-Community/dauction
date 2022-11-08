import { parseEther, formatEther } from  "ethers/lib/utils";
import { BigNumberish } from "ethers";

const parseToken = (payload: string) => parseEther(payload)

const formatToken = (payload: BigNumberish) => formatEther(payload)

// Convert returned price feed to number using appropriate decimals
const convertPriceToNumber = (price: number, decimals: number) => 
    Number((price / Math.pow(10, decimals)).toFixed(2));

export { parseToken, formatToken, convertPriceToNumber }