// const hre = require("hardhat");
import { ethers } from "hardhat";
import { WETH_USD, WBTC_USD, LINK_USD } from "../utils/price_feed_constants.utils"




// let deployer, addr1, addr2, addr3, addr4, usdtContractAddress, MockWETH, MockWETH, MockUSDT, mockUSDT, MockLINK, mockLink, MockWbtc, mockWbtc
const main = async () => {
  // [deployer, addr1, addr2, addr3, addr4] = await ethers.getSigners();

  // mockUSDT contract deployment
  // const MockUSDT = await ethers.getContractFactory('MockToken')
  // const mockUSDT = await MockUSDT.deploy("Mock USDT", "mUSDT")
  // await mockUSDT.deployed()
  // console.log("mock usdt address:__", mockUSDT.address)

 /*
  // mockLINK contract deployment 
  const MockLINK = await ethers.getContractFactory('MockToken')
  const mockLINK = await MockLINK.deploy("Mock LINK", "mLINK")
  await mockLINK.deployed()
  console.log("mock link address:__", mockLINK.address)

  // mockWETH contract deployment
  const MockWETH = await ethers.getContractFactory('MockToken')
  const mockWETH = await MockWETH.deploy("Mock WETH", "mWETH")
  await mockWETH.deployed()
  console.log("mock weth address:__", mockWETH.address)

  // mockWBTC contract deployment
  const MockWBTC = await ethers.getContractFactory('MockToken')
  const mockWbtc = await MockWBTC.deploy("Mock WBTC", "mWBTC")
  await mockWbtc.deployed()
  console.log("mock wbtc address:__", mockWbtc.address)
*/


  // mockUSDT = await MockUSDT.deploy()
  // await mockUSDT.deployed()
  // usdtContractAddress = mockUSDT.address;

  // console.log(`usdt address: ${usdtContractAddress}`)

  // // transaction: transfer 1m mockUSDT to addr1
  // const transferUSDTToAddr1 = await mockUSDT.connect(deployer).transfer(addr1.address, parseToken(10000000));
  // await transferUSDTToAddr1.wait();

  const NFTContract = await ethers.getContractFactory('NFTContract')
  const nftContract = await NFTContract.deploy('DauctionNFT', 'DNFT', "ipfs://QmeYhWhdX1ALiF5AeaHM5VwAR6XEUqL58kmdEx8GxxPkXk/")
  await nftContract.deployed()
  const nftContractAddress = nftContract.address
  console.log(`NFT Contract address: ${nftContractAddress}`)

   
   // first 10 nft mint by deployer
   const totalMints = 10;
   for (let i = 0; i < totalMints; i++) {
     const txn = await nftContract.mintNFT()
     await txn.wait()
   }


  // const mockUsdtAddress: string = "0x289bc9A76ADbF81746db9A8e99DdF6776d41D84b"
  // const mockLinkAddress: string = "0xda469e02e3d939c3ffafa5e8bf9569ccffe8da0d"
  // const mockWethAddress: string = "0x5db5A283bdEBF69a9e779E7feF7d6616b02DFFe6"
  // const mockWbtcAddress: string = "0x5Df75FF8fe3fCBbf056dB82ad5b6c96aa5044964"
  
  //     // Dauction constructor params
  //     const DAUCTION_CONSTRUCTOR_PARAMS = [
  //       {
  //         token: mockUsdtAddress,
  //         priceFeed: ethers.constants.AddressZero
  //       },
  //       {
  //         token: mockLinkAddress,
  //         priceFeed: LINK_USD
  //       },
  //       {
  //         token: mockWethAddress,
  //         priceFeed: WETH_USD
  //       },
  //       {
  //         token: mockWbtcAddress,
  //         priceFeed: WBTC_USD
  //       },
  
  //     ];
  
  // const Dauction = await ethers.getContractFactory('Dauction')
  // const dauction = await Dauction.deploy(DAUCTION_CONSTRUCTOR_PARAMS, mockUsdtAddress)
  // await dauction.deployed()
  // const dauctionAddress = dauction.address
  // console.log(`dauction deployed to : ${dauctionAddress}`)



}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`deploy error: ${err}`);
    process.exit(1);
  });
