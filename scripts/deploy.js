const hre = require("hardhat");

const { parseToken, formatToken } = '../utility/conversion.utils.js'

let deployer, addr1, addr2, addr3, addr4, usdtContractAddress
const main = async () => {
  [deployer, addr1, addr2, addr3, addr4] = await ethers.getSigners();

  // // mockUSDT contract deployment
  // MockUSDT = await ethers.getContractFactory('MockUSDT')
  // mockUSDT = await MockUSDT.deploy()
  // await mockUSDT.deployed()
  // usdtContractAddress = mockUSDT.address;

  // console.log(`usdt address: ${usdtContractAddress}`)

  // // transaction: transfer 1m mockUSDT to addr1
  // const transferUSDTToAddr1 = await mockUSDT.connect(deployer).transfer(addr1.address, parseToken(10000000));
  // await transferUSDTToAddr1.wait();

  const NFTContract = await hre.ethers.getContractFactory('NFTContract')
  const nftContract = await NFTContract.deploy('DauctionNFT', 'DNFT')
  await nftContract.deployed()
  const nftContractAddress = nftContract.address
  console.log(`NFT Contract address: ${nftContractAddress}`)
  
  // const Dauction = await hre.ethers.getContractFactory('Dauction')
  // const dauction = await Dauction.deploy(usdtContractAddress)
  // await dauction.deployed()
  // const dauctionAddress = dauction.address
  // console.log(`Auction Marketplace deployeded to : ${dauctionAddress}`)
 
   // first 10 nft mint by deployer
   const totalMints = 10;
   for (i = 0; i < totalMints; i++) {
     const txn = await nftContract.mintNFT()
     await txn.wait()
   }


}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`deploy error: ${err}`);
    process.exit(1);
  });
