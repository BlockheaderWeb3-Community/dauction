import { parseEther, formatEther } from  "ethers/lib/utils";
import { BigNumberish,BigNumber } from "ethers";



// Convert returned price feed to number using appropriate decimals
const convertPriceToNumber = (price: number, decimals: number): Number => 
    Number((price / Math.pow(10, decimals)).toFixed(2));


const toBN = (value: BigNumberish):BigNumber  => BigNumber.from(value)
export { convertPriceToNumber, toBN }