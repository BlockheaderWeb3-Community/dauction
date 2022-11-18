// const hre = require("hardhat");
import { ethers } from "hardhat";
import { WETH_USD, WBTC_USD, LINK_USD } from "../utils/price_feed_constants.utils"




// let deployer, addr1, addr2, addr3, addr4, usdtContractAddress, MockWETH, MockWETH, MockUSDT, mockUSDT, MockLINK, mockLink, MockWbtc, mockWbtc
const main = async () => {
  // [deployer, addr1, addr2, addr3, addr4] = await ethers.getSigners();
  /*
  // mockUSDT contract deployment
  const MockUSDT = await ethers.getContractFactory('MockToken')
  const mockUSDT = await MockUSDT.deploy("Mock USDT", "mUSDT")
  await mockUSDT.deployed()
  console.log("mock usdt address:__", mockUSDT.address)


 
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




  // mockUSDT = await MockUSDT.deploy()
  // await mockUSDT.deployed()
  // usdtContractAddress = mockUSDT.address;

  // console.log(`usdt address: ${usdtContractAddress}`)

  */


  // // transaction: transfer 1m mockUSDT to addr1
  // const transferUSDTToAddr1 = await mockUSDT.connect(deployer).transfer(addr1.address, parseToken(10000000));
  // await transferUSDTToAddr1.wait();

  // const NFTContract = await ethers.getContractFactory('NFTContract')
  // const nftContract = await NFTContract.deploy('DauctionNFT', 'DNFT', "ipfs://QmdpNoQ16WegTsACrETv81VZH9E5dsuaHGiABtefkcvHrq/")
  // await nftContract.deployed()
  // const nftContractAddress = nftContract.address
  // console.log(`NFT Contract address: ${nftContractAddress}`)

   
  //  // first 10 nft mint by deployer
  //  const totalMints = 10;
  //  for (let i = 0; i < totalMints; i++) {
  //    const txn = await nftContract.mintNFT()
  //    await txn.wait()
  //  }

 
  const mockUsdtAddress: string = "0xF2e6a9D38fd8CD44E47dc7056d5d53437F439960"
  const mockLinkAddress: string = "0x5287a50e5fA645d076Dce101A9C22C62E49BECF6"
  const mockWethAddress: string = "0x0EE68932A59276FEfaf7dA0F68DfEC8472Be3296"
  const mockWbtcAddress: string = "0x31B2d46A1f00792ec22897F67C6880cFf38B97aE"
  
      // Dauction constructor params
      const DAUCTION_CONSTRUCTOR_PARAMS = [
        {
          token: mockUsdtAddress,
          priceFeed: ethers.constants.AddressZero
        },
        {
          token: mockLinkAddress,
          priceFeed: LINK_USD
        },
        {
          token: mockWethAddress,
          priceFeed: WETH_USD
        },
        {
          token: mockWbtcAddress,
          priceFeed: WBTC_USD
        },
  
      ];
  
  const Dauction = await ethers.getContractFactory('Dauction')
  const dauction = await Dauction.deploy(DAUCTION_CONSTRUCTOR_PARAMS, mockUsdtAddress, 15)
  await dauction.deployed()
  const dauctionAddress = dauction.address
  console.log(`dauction deployed to : ${dauctionAddress}`)





}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`deploy error: ${err}`);
    process.exit(1);
  });
