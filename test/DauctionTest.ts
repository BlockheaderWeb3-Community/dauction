import { expect } from "chai";
import { ethers } from "hardhat";
import { convertPriceToNumber } from "../utils/conversion.utils";
import { WETH_USD, WBTC_USD, LINK_USD, ZERO_ADDRESS } from "../utils/price_feed_constants.utils"
import { hexify, decodeBidHash, numToBytes32, testDecodeHash, hashCommitmentParams, createSalt } from "../utils/hex.utils"
import { parseEther, formatEther } from "ethers/lib/utils";
import { utils, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Dauction } from "../typechain-types/contracts/Dauction";
import { Dauction__factory } from "../typechain-types/factories/contracts/Dauction__factory";
import { MockToken } from "../typechain-types/contracts/MockToken";
import { MockToken__factory } from "../typechain-types/factories/contracts/MockToken__factory";
import { NFTContract } from "../typechain-types/contracts/NFTContract";
import { NFTContract__factory } from "../typechain-types/factories/contracts/NFTContract__factory";
import { increaseBlockTimestamp, setTime } from "../utils/time.utils"
const INITIAL_TOKEN_TRANSFER_AMOUNT = 1000

const [mUSDT, mLINK, mWBTC, mWETH] = ["mUSDT", "mLINK", "mWBTC", "mWETH"]

describe("Dauction Marketplace", async () => {

  let
    dauction: Dauction,
    nftContract: NFTContract,
    mockUSDT: MockToken,
    mockWETH: MockToken,
    mockLINK: MockToken,
    mockWBTC: MockToken,
    deployer: SignerWithAddress,
    addr1: SignerWithAddress,
    addr2: SignerWithAddress,
    addr3: SignerWithAddress,
    addr4: SignerWithAddress

  beforeEach(async () => {

    [deployer, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const nftDeployer = new NFTContract__factory(deployer);
    nftContract = await nftDeployer.deploy('DauctionNFT', 'dNFT');  // ntf contract deployment

    // mockUSDT contract deployment
    const ERC20Deployer = new MockToken__factory(deployer);
    mockUSDT = await ERC20Deployer.deploy("MockUSDT", mUSDT);

    // mockWETH contract deployment
    mockWETH = await ERC20Deployer.deploy("MockWETH", mWETH);

    // mockWBTC contract deployment
    mockWBTC = await ERC20Deployer.deploy("MockWBTC", mWBTC);

    // mockLINK contract deployment
    mockLINK = await ERC20Deployer.deploy("MockLINK", mLINK);

    // Dauction constructor params
    const DAUCTION_CONSTRUCTOR_PARAMS = [
      {
        token: mockUSDT.address,
        priceFeed: ethers.constants.AddressZero
      },
      {
        token: mockLINK.address,
        priceFeed: LINK_USD
      },
      {
        token: mockWETH.address,
        priceFeed: WETH_USD
      },
      {
        token: mockWBTC.address,
        priceFeed: WBTC_USD
      },

    ];
    const dauctionDeployer = new Dauction__factory(deployer);
    dauction = await dauctionDeployer.deploy(DAUCTION_CONSTRUCTOR_PARAMS, mockUSDT.address);

    // first 10 nft mint by deployer
    for (let i = 0; i < 10; i++) {
      await nftContract.mintNFT();
    }
    const transferAmount = parseEther(INITIAL_TOKEN_TRANSFER_AMOUNT.toString());
    // transaction: transfer 1k mockUSDT to addr1
    await mockUSDT.transfer(addr1.address, transferAmount);

    // transaction: transfer 1k mockUSDT to addr2
    await mockUSDT.transfer(addr2.address, transferAmount);

    // transaction: transfer 1k mockUSDT to addr3
    await mockUSDT.transfer(addr3.address, transferAmount);

    // transaction: transfer NFT 1 to addr1
    await nftContract.transferFrom(deployer.address, addr1.address, 1);

    // transaction: transfer NFT 2 to addr2
    await nftContract.transferFrom(deployer.address, addr2.address, 2);
    // transaction: transfer NFT 2 to addr3
    await nftContract.connect(deployer).transferFrom(deployer.address, addr3.address, 3);

  })

  describe('Deployment', () => {
    it("Should correctly set bid tokens", async () => {
      expect(await dauction.checkBidTokenUSDTEquivalence(mockUSDT.address)).to.eq(true);
      expect(await dauction.bidTokenToPriceFeed(mockWETH.address)).to.eq(WETH_USD);
      expect(await dauction.bidTokenToPriceFeed(mockWBTC.address)).to.eq(WBTC_USD);
      expect(await dauction.bidTokenToPriceFeed(mockLINK.address)).to.eq(LINK_USD);
      expect(await dauction.bidTokenToPriceFeed(mockUSDT.address)).to.eq(ethers.constants.AddressZero);
    });
  })

  describe('Mint NFt', () => {
    it("Should return mint status following successful deployment", async () => {
      expect(await nftContract.ownerOf(1)).to.eq(addr1.address);
      expect(await nftContract.ownerOf(2)).to.eq(addr2.address);
      expect(await nftContract.ownerOf(3)).to.eq(addr3.address);
      expect(await nftContract.totalMinted()).to.eq(10);

    })
  })
  describe('Price Feed', () => {
    it("should return formatted price feed of tokens", async () => {

      // WETH/USD price
      const wEthPriceResult = await dauction.getLatestPrice(WETH_USD)
      const [wethPrice, wethDecimals] = wEthPriceResult

      // Convert the price to a number and return it
      const formattedEthPrice = convertPriceToNumber(Number(wethPrice), wethDecimals);

      console.log("formatted weth price", formattedEthPrice)
      // assertion statement that WETH price is gte 1000 USD based on real-time exchange rate
      expect(formattedEthPrice).to.be.gte(1000)

      // // // WBTC/USD price
      const wBTCPriceResult = await dauction.getLatestPrice(WBTC_USD)
      const [wbtcPrice, wbtcDecimals] = wBTCPriceResult

      const formattedWbtcPrice = convertPriceToNumber(Number(wbtcPrice), wbtcDecimals)

      console.log("formatted BTC price", formattedWbtcPrice)
      // assertion statement that WBTC price is gte 10000 USD based on real-time exchange rate
      expect(formattedWbtcPrice).to.be.gte(10000)

      //  LINK/USD price
      const linkPriceResult = await dauction.getLatestPrice(LINK_USD)
      const [linkPrice, linkDecimals] = linkPriceResult

      // const formattedLinkPrice =  Number((linkPrice.toString() / Math.pow(10, linkDecimals)).toFixed(2));
      const formattedLinkPrice = convertPriceToNumber(Number(linkPrice), linkDecimals)



      // assertion statement that WBTC price is gte 2 USD based on real-time exchange rate
      expect(formattedLinkPrice).to.be.gte(2)
    })

    it("should return base price", async () => {
      const calculatedWethBasePrice = await dauction.calculateBasePrice(WETH_USD, 5)
      console.log("calculated based price__", calculatedWethBasePrice)
      expect(calculatedWethBasePrice).to.be.gte(1000)

      const calculatedLinkBasePrice = await dauction.calculateBasePrice(LINK_USD, 5)
      console.log("calculated based price__", calculatedLinkBasePrice)
      expect(calculatedLinkBasePrice).to.be.gte(2)

    });


  })



  // describe('Create Auction', () => {
  //   it("Should allow nft owner to create auction", async () => {
  //     // deployer/seller approves auction contract
  //     const addr1ApproveNFTTxn = await nftContract.connect(addr1).approve(dauctionContractAddress, 1)
  //     await addr1ApproveNFTTxn.wait()

  //     // check nft 1 approval status
  //     const approvedAccount = await nftContract.getApproved(1)
  //     expect(approvedAccount).to.be.eq(dauction.address)
  //     console.log(`approved account: ${approvedAccount}`)
  //     console.log(`dauction contract address: ${dauction.address}`)

  //     // 5 mins
  //     let auctionStartTime = Math.floor(Date.now() / 1000) + (60)
  //     let auctionEndTime = Math.floor(Date.now() / 1000) + (60 * 60 * 2)
  //     // console.log(`user specified time: ${userSpecifiedTime}`)

  //     // nft owner/addr1 creates auction
  //     const createAuctionTxn = await dauction.connect(addr1).createAuction(nftContract.address, 1, 5, auctionStartTime, auctionEndTime)
  //     await createAuctionTxn.wait()


  //     // // get auction details
  //     const auctionDetails = await dauction.auctions(nftContractAddress, 1)
  //     const { seller, startTime, minBidPrice, endTime, highestBidAddress, highestBidAmount, auctionStatus } = auctionDetails

  //     const auctionState = await dauction.getAuctionStatus(nftContractAddress, 1)

  //     console.log(`auction status: ${auctionState}`)
  //     console.log(`seller: ${seller}`)
  //     console.log(`start date: ${startTime}`)
  //     console.log(`minbid: ${minBidPrice}`)
  //     console.log(`endTime: ${endTime}`)
  //     console.log(`highest bid address: ${highestBidAddress}`)
  //     console.log(`highest bid amount: ${highestBidAmount}`)
  //     console.log(`auction status: ${auctionStatus}`)


  //     assert.equal(seller, addr1.address)
  //     assert.equal(minBidPrice, 5)
  //     assert.equal(auctionStatus, 1)
  //     assert.equal(auctionState, "Initiated")



  //     const bidValue = 5
  //     // // addr1 initiates bid 1



  //     const hexifyBidValue = hexify(bidValue)
  //     const hexifySalt = hexify(hexifyBidValue)
  //     const bidCommitment = hexify(hexifySalt)
  //     console.log("bid commitment hash__", bidCommitment)
  //     const createBidTxn = await dauction.connect(addr2).createBid(nftContract.address, 1, bidCommitment)

  //     // bytes32 bidValueHash = keccak256(abi.encodePacked(bidValue));
  //     // bytes32 saltHash = keccak256(abi.encodePacked(salt));

  //     // bytes32 commitmentHash = keccak256(
  //     //     abi.encodePacked(bidValueHash, saltHash)
  //     // );


  //     console.log("bid hash__", hexify(5))
  //     await createBidTxn.wait()

  //     // after 30s
  //     await new Promise(resolve => {
  //       // console.log('resolve__', resolve)
  //       setTimeout(resolve, 3000) // 30s: bidder  
  //     })

  //     // bytes32 bidValueHash = keccak256(abi.encodePacked(bidValue));
  //     // bytes32 saltHash = keccak256(abi.encodePacked(salt));

  //     // bytes32 commitmentHash = keccak256(
  //     //     abi.encodePacked(bidValueHash, saltHash)
  //     // );


  //     console.log("num to bytes__", numToBytes32(777))



  //     const testOneParams = [nftContractAddress, 1, addr2.address, 1]
  //     const testTwoParams = [nftContractAddress, 2, addr3.address, 2]

  //     const addr1BidStatus = await dauction.getBidStatus(...testOneParams)
  //     console.log('bid status__', addr1BidStatus)


  //     expect(addr1BidStatus).to.be.eq(1)

  //     // // // // get addr1 bid hash
  //     const bidHash = await dauction.getBidHash(...testOneParams)


  //     console.log(`bid hash return value: ${bidHash}`)

  //     const hexArray = [addr2.address, bidCommitment]


  //     // expect(bidHash).to.be.eq(decodeBidHash(addr2.address, hexifySalt))
  //     expect(bidHash).to.be.eq(decodeBidHash(...hexArray))

  //     // // // // revert addr2 attempt to bid again for same nft
  //     // expect(dauction.connect(addr2).createBid(...testOneParams)).to.be.reverted

  //     // const bidders = await dauction.getBidders(nftContractAddress, 1)
  //     // console.log("bidders__", bidders)


  //   })
  // })

  describe('Create Auction Validations', () => {
    it("should revert negative create auction cases", async () => {
      // addr1 approves auction contract
      await nftContract.connect(addr1).approve(dauction.address, 1)


      const FAIL_CASES = [
        [nftContract.address, 1, 0, setTime(2), setTime(4), setTime(5)],
        [nftContract.address, 1, 5, setTime(0), setTime(2), setTime(3)],
        [nftContract.address, 1, 5, setTime(3), setTime(1), setTime(3)],
        [nftContract.address, 1, 5, setTime(2), setTime(2), setTime(2)],
        [nftContract.address, 1, 5, setTime(2), setTime(5), setTime(6)]

      ] as const

      expect(dauction.connect(addr1).createAuction(...FAIL_CASES[0])).to.be.reverted // revert NFT owner attempt to add 0 minBidPrice
      expect(dauction.connect(addr1).createAuction(...FAIL_CASES[1])).to.be.reverted // revert NFT owner attempt to set invalid startTime
      expect(dauction.connect(addr1).createAuction(...FAIL_CASES[2])).to.be.reverted // revert NFT owner attempt to set invalid endTime
      expect(dauction.connect(addr1).createAuction(...FAIL_CASES[3])).to.be.reverted // revert NFT owner attempt to set invalid duration period
      expect(dauction.createAuction(...FAIL_CASES[4])).to.be.reverted // revert non-NFT owner attempt to set auction




      // *** AUCTION VALIDATIONS *** //
      // expect(dauction.connect(addr1).createAuction(...FAIL_CASES[1])).to.be.reverted // revert invalid end time of  30mins
      // expect(dauction.connect(addr1).createAuction(...FAIL_CASES[2])).to.be.reverted // revert 


      // const auctionDetails = await dauction.auctions(nftContractAddress, 1)


      // const { seller, startTime, minBidPrice, endTime, highestBidAddress, highestBidAmount, auctionStatus } = auctionDetails

      // const tokenUri = await nftContract.getTokenURI(1)
      // console.log("token uri 1___", tokenUri)

      // expect(tokenUri).to.be.eq("https://ipfs.io/ipfs/QmRn4Aaj4LMuunoJL3XNz92N1DwVdiesrvMJGymj26TnMF")


      // expect(seller).to.be.eq(addr1.address)
      // expect(minBidPrice).to.eq(5)
      // expect(auctionStatus).to.be.eq(1)
      // const auctionState = await dauction.getAuctionStatus(nftContractAddress, 1)
      // expect(auctionState).to.be.eq("Initiated")
      // expect(await nftContract.ownerOf(1)).to.eq(dauction.address)  // test NFT 1 ownership address
      // revert addr1 attempt to reauction already-created item      
      // expect(dauction.connect(addr1).createAuction(...CASES[0])).to.be.reverted


      // address nftContractAddress,
      // uint256 tokenId,
      // bytes32 bidCommitment



      // const bidValue = 5
      // // const salt = 1000

      // const salt = createSalt(1000)
      // const salt2 = createSalt(777)

      // console.log("salt__", salt)

      // const hexifyBidValue = hexify(bidValue)
      // const hexifySalt = hexify(hexifyBidValue)
      // const bidCommitment = hexify(hexifySalt)
      // console.log("bid commitment hash__", bidCommitment)



      // const hashedParam = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("street salt"));
      // console.log("hashed params__", hashedParam)

      // const hashedParam2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(6));
      // console.log("hashed param 2__", hashedParam2)

      // // const hexifiedCommitment = hexify(hashedParam)

      // // console.log("hexified commitment___", hexifiedCommitment)


      // const testHash1 = ethers.utils.keccak256(hashedParam2)
      // const hashOfSalt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("salt"))
      // const hashOfBidValue = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(5))

      // const rawMessage = ethers.utils.concat([
      //   ethers.utils.zeroPad(bidValue, 32),
      //   ethers.utils.arrayify(1000),
      // ])

      // const hashOfCommitment = ethers.utils.keccak256(rawMessage)

      // console.log("hash of commitment___", hashOfCommitment)

      // console.log("raw message__", rawMessage)
      // console.log("test hash 1__", testHash1)

      // console.log('hashed param2 __', hashedParam2)
      // console.log("hexified param2__", hexify(hashedParam2))

      // console.log("hash street__", ethers.utils.toUtf8Bytes("street"))

      // const decodedParam1 = testDecodeHash(hashedParam)
      // console.log("decoded param 1__", decodedParam1)

      // const commitHash = hashCommitmentParams(bidValue, salt)


      // console.log("commit___push__", commitHash)

      // ethers.utils.




      // *** BID VALIDATIONS *** //
      // const BID_PARAMS = [nftContract.address, 1, commitHash]

      // const commitHash2 = hashCommitmentParams(7, salt2)
      // const BID_PARAMS_2 = [nftContract.address, 1, commitHash2]
      // const FAIL_BID_PARAMS = [nftContract.address, 1, bidCommitment ]
      // const FAIL_BID_PARAMS = [
      //   [dauction.address, 1, bidCommitment],
      //   [nftContract.address, 0, bidCommitment],
      //   [nftContract.address, 1, hexify(0)]
      // ]
      // expect(dauction.connect(addr2).createBid(...FAIL_BID_PARAMS[0])).to.be.reverted // revert addr2 attempt to  create bid with wrong NFT token contract
      // expect(dauction.connect(addr2).createBid(...FAIL_BID_PARAMS[1])).to.be.reverted // revert addr2 attempt to  create bid on non-existent token


      // const zeroCommitment = hexify(0)
      // console.log('zero commitment___', zeroCommitment)

      // expect(dauction.connect(addr2).createBid(...FAIL_BID_PARAMS[2])).to.be.reverted // revert addr1 attempt to  create bid with 0 bid commitment
      // expect(dauction.connect(addr1).createBid(...BID_PARAMS)).to.be.reverted // revert addr1/asset owner attempt to  create bid 


      // Test revert test cases for bidding past the auction end time
      // await helpers.time.increase(setTime(60 * 3)); // increase time to past auction end time

      // expect(dauction.connect(addr2).createBid(...BID_PARAMS)).to.be.reverted // revert addr2/bidder attempt to  create bid past the auction end time


      // await helpers.time.increase(setTime(60 * 2)); // increase time to past auction end time


      // const addr2createBidTxn = await dauction.connect(addr2).createBid(...BID_PARAMS)
      // await addr2createBidTxn.wait()




      // const addr3createBidTxn = await dauction.connect(addr3).createBid(...BID_PARAMS_2)
      // await addr3createBidTxn.wait()

      // const bidders = await dauction.getBidders(nftContractAddress, 1)

      // console.log("bidders__", bidders)
      // console.log("bidder__", addr2.address)

      // for (i = 0; i < bidders.length; i++) {
      //   expect(bidders[0]).to.be.eq(addr2.address)
      //   expect(bidders[1]).to.be.eq(addr3.address)
      // }

      // // expect(bidders).to.eq(addr2.address)

      // const GET_BID_HASH_PARAMS = [nftContract.address, 1, addr2.address, 1]
      // const returnedBidHash = await dauction.getBidHash(...GET_BID_HASH_PARAMS)
      // console.log("returned bid hash__", returnedBidHash)

      // const addr2DecodedBidHash = decodeBidHash(addr2.address, commitHash)
      // console.log("decoded_______", addr2DecodedBidHash)

      // expect(returnedBidHash).to.be.eq(addr2DecodedBidHash)



      // const REVEAL_BID_PARAMS = [nftContract.address, 1, bidValue, salt, 1]
      // expect(dauction.connect(addr2).revealBid(...REVEAL_BID_PARAMS)).to.be.reverted // revert attempt to reveal bid before auction end time



      // await helpers.time.increase(setTime(60 * 3)); // increase time to past auction end time


      // const addr2RevealBidTxn = await dauction.connect(addr2).revealBid(...REVEAL_BID_PARAMS)

      // await addr2RevealBidTxn.wait()


      // const auctionRevealStatus = await dauction.auctions(nftContract.address, 1)

      // const { highestBidAddress: highestBidder, highestBidAmount: highestBid } = auctionRevealStatus



      // console.log("revealed highest bidder___", highestBidder)
      // console.log("revealed highest bid amount___", highestBid)

      // expect(highestBidder).to.be.eq(addr2.address)
      // expect(formatEther(highestBid)).to.be.eq(formatEther(bidValue.toString()))




      // console.log("auction reveal status__", auctionRevealStatus)














      // const addr2createBidTxn = await dauction.connect(addr2).createBid(...BID_PARAMS)

      // await addr2createBidTxn.wait()







      // const addr2createBidTxn = await dauction.connect(addr2).createBid(...BID_PARAMS)  
      // await addr2createBidTxn.wait()
      // const addr2BidTxn = await dauction.connect(addr2).createBid(...BID_PARAMS)
      // await addr2BidTxn.wait()

      // const addr1CreateAuctionTxnFail = await dauction.connect(addr1).createAuction(...CASES[0])
      // await addr1CreateAuctionTxnFail.wait()

      // get auction details
      // const auctionDetails = await dauction.auctions(nftContractAddress, 1)
      // const { seller, startTime, minBidPrice, endTime, highestBidAddress, highestBidAmount, auctionStatus } = auctionDetails

      // console.log("seller_", seller)
      // console.log("auction status__", auctionStatus)

      // const auctionState = await dauction.getAuctionStatus(nftContractAddress, 1)






      // // assertion to test the revert of bidder to bid below 5 USDT
      // expect(dauction.connect(addr1).createBid(1, 4)).to.be.reverted


      // expect(dauction.connect(addr1).createBid(1, 4)).to.be.revertedWith("bid cannot be lower than min amount specified")

      // await new Promise(resolve => {
      //   // console.log('resolve__', resolve)
      //   setTimeout(resolve, 30000) // 30s: bidder  
      // })

      // revert bidder attempt to bid past the auction validity period
      // expect(dauction.connect(addr1).createBid(1, 5)).to.be.reverted



    })
    it("should successfully create auction", async () => {
      /* 
      CREATE ACTION PARAMS
      address nftContractAddress,
      uint256 tokenId,
      bidAmount,
      startTime,
      endTime, 
      revealDuration
    */
      // array containing create auction params
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(2), setTime(5), setTime(6)] as const

      // approve dauction contract to use NFT
      const addr1ApproveNFTTxn = await nftContract.connect(addr1).approve(dauction.address, 1)
      await addr1ApproveNFTTxn.wait()

      // nft owner create auction transaction
      const addr1CreateAuctionTxn = await dauction.connect(addr1).createAuction(...AUCTION_PARAMS)
      await addr1CreateAuctionTxn.wait()

      // get auction details
      const auctionDetails = await dauction.auctions(AUCTION_PARAMS[0], AUCTION_PARAMS[1])
      const { startTime, minBidPrice, endTime, revealDuration, auctionStatus, owner } = auctionDetails

      expect(minBidPrice).to.eq(5) // expect minBidPrice to equal 5
      expect(auctionStatus).to.eq(1) // expect auctionStatus to equal 1 based on the set enum state
      expect((startTime)).to.eq(BigNumber.from(await AUCTION_PARAMS[3])) // expect start time to eq passed in start time
      expect((endTime)).to.eq(BigNumber.from(await AUCTION_PARAMS[4])) // expect start time to eq passed in end time
      expect((revealDuration)).to.eq(BigNumber.from(await AUCTION_PARAMS[5])) // expect start time to eq passed in end duration time
      expect(owner).to.eq(addr1.address) // expect auction owner to equal address 1
    })
  })

  describe("Create Bid", async () => {
    it("should revert when auction does not exist", async () => {
      await expect(dauction.createBid(nftContract.address,1,ethers.constants.HashZero,mockWETH.address)).
      to.be.revertedWith("non-existent auction item");

      // /* 
      //   CREATE BID PARAMS
      //   address nftContractAddress,
      //   uint256 tokenId,
      //   bytes32 bidCommitment,
      //   address bidToken
      // */

      // const bidValue = 5
      // let rawSalt = 777

      // // hexified salt
      // const salt = createSalt(rawSalt)

      // console.log("resultant salt__", salt)

      // //  hashed bid commitment
      // const bidCommitHash = hashCommitmentParams(bidValue, salt)

      // const FAIL_BID_PARAMS = [
      //   [dauction.address, 1, bidCommitHash, ZERO_ADDRESS],
      //   [dauction.address, 1, bidCommitHash, mockWETH.address],
      //   [nftContract.address, 0, bidCommitHash,],
      //   [nftContract.address, 1, hexify(0)]
      // ] as const


      // expect(dauction.connect(addr2).createBid(...FAIL_BID_PARAMS[1])).to.be.reverted // revert addr2 attempt to create bid on unauctioned NFT
    });

    it("should revert when bid commitment is zero", async() => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1) , setTime(5), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      await expect(dauction.createBid(nftContract.address,1,ethers.constants.HashZero,mockWETH.address)).
      to.be.revertedWith("zero bid commitment");
    });

    it("reverts when the bid token is invalid", async() => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(5), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      await expect(dauction.createBid(nftContract.address,1,numToBytes32(1),addr4.address)).
      to.be.revertedWith("invalid bid token");
    });

    it("reverts when the auction hasn't started", async() => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(2), setTime(5), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      await expect(dauction.createBid(nftContract.address,1,numToBytes32(1),mockWETH.address)).
      to.be.revertedWith("Auction has not started");
    });

    it("reverts when the bidder is auction owner", async() => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(5), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await expect(dauction.connect(addr1).createBid(nftContract.address,1,numToBytes32(1),mockWETH.address)).
      to.be.revertedWith("auction seller cannot bid");
    });

    it("reverts when the auction has finished", async() => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(4), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(5);
      await expect(dauction.createBid(nftContract.address,1,numToBytes32(1),mockWETH.address)).
      to.be.revertedWith("auction is finished");
    });

    it("reverts when there is an existing bid from the bidder", async() => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(4), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await dauction.createBid(nftContract.address,1,numToBytes32(1),mockWETH.address)
      await expect(dauction.createBid(nftContract.address,1,numToBytes32(2),mockWETH.address)).
      to.be.revertedWith("BidCommithash has been initialized");
    });

    it.only("bid successfully with correct bid parameters", async() => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(4), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await dauction.createBid(nftContract.address,1,numToBytes32(10),mockWETH.address);
      const auctionDetails = await dauction.auctions(nftContract.address, 1);
       console.log(auctionDetails);           
    });
  })

});


