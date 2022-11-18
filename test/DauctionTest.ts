import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { parseEther, formatEther } from "ethers/lib/utils";
import { convertPriceToNumber, toBN } from "../utils/conversion.utils";
import { WETH_USD, WBTC_USD, LINK_USD, ZERO_ADDRESS, MAX_UINT256 } from "../utils/price_feed_constants.utils"
import { hashCommitmentParams, createSalt, ZERO_BYTES_32, unveilHashCommitment } from "../utils/hex.utils"
import { Dauction } from "../typechain-types/contracts/Dauction";
import { Dauction__factory } from "../typechain-types/factories/contracts/Dauction__factory";
import { MockToken } from "../typechain-types/contracts/MockToken";
import { MockToken__factory } from "../typechain-types/factories/contracts/MockToken__factory";
import { NFTContract } from "../typechain-types/contracts/NFTContract";
import { NFTContract__factory } from "../typechain-types/factories/contracts/NFTContract__factory";
import { addHours, increaseBlockTimestamp, setHour, setTime } from "../utils/time.utils"
const INITIAL_TOKEN_TRANSFER_AMOUNT = 10000

const [mUSDT, mLINK, mWBTC, mWETH] = ["mUSDT", "mLINK", "mWBTC", "mWETH"];

describe('Dauction Marketplace', async () => {

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
    addr4: SignerWithAddress,
    addr5: SignerWithAddress

  beforeEach(async () => {

    [deployer, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
    const nftDeployer = new NFTContract__factory(deployer);
    nftContract = await nftDeployer.deploy('DauctionNFT', 'dNFT', "ipfs://QmeYhWhdX1ALiF5AeaHM5VwAR6XEUqL58kmdEx8GxxPkXk/");  // ntf contract deployment

    // mockUSDT contract deployment
    const ERC20Deployer = new MockToken__factory(deployer);
    mockUSDT = await ERC20Deployer.deploy("MockUSDT", mUSDT);
    await mockUSDT.deployed()

    // mockWETH contract deployment
    mockWETH = await ERC20Deployer.deploy("MockWETH", mWETH);
    await mockWETH.deployed()

    // mockWBTC contract deployment
    mockWBTC = await ERC20Deployer.deploy("MockWBTC", mWBTC);
    await mockWBTC.deployed()

    // mockLINK contract deployment
    mockLINK = await ERC20Deployer.deploy("MockLINK", mLINK);
    await mockLINK.deployed()

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
    dauction = await dauctionDeployer.deploy(DAUCTION_CONSTRUCTOR_PARAMS, mockUSDT.address,  60);

    // first 10 nft mint by deployer
    for (let i = 0; i < 10; i++) {
      await nftContract.mintNFT();
    }
    const transferAmount = parseEther(INITIAL_TOKEN_TRANSFER_AMOUNT.toString());
    // transaction: transfer 10k mockUSDT to addr1
    await mockUSDT.transfer(addr1.address, transferAmount);

    // transaction: transfer 10k mockUSDT to addr2
    await mockUSDT.transfer(addr2.address, transferAmount);

    // transaction: transfer 10k mockUSDT to addr3
    await mockUSDT.transfer(addr3.address, transferAmount);

    // ===== mockETH TRANSFERS ==== //
    // transaction: transfer 10k mockWBTC to addr1
    await mockWETH.transfer(addr1.address, transferAmount);

    // transaction: transfer 10k mockWBTC to addr2
    await mockWETH.transfer(addr2.address, transferAmount);

    // transaction: transfer 10k mockWBTC to addr3
    await mockWETH.transfer(addr3.address, transferAmount);


    // ===== mockWBTC TRANSFERS ==== //
    // transaction: transfer 10k mockWBTC to addr1
    await mockWBTC.transfer(addr1.address, transferAmount);

    // transaction: transfer 10k mockWBTC to addr2
    await mockWBTC.transfer(addr2.address, transferAmount);

    // transaction: transfer 10k mockWBTC to addr3
    await mockWBTC.transfer(addr3.address, transferAmount);

    // ===== mockLINK TRANSFERS ==== //
    // transaction: transfer 10k mockWBTC to addr1
    await mockLINK.transfer(addr1.address, transferAmount);

    // transaction: transfer 10k mockWBTC to addr2
    await mockLINK.transfer(addr2.address, transferAmount);

    // transaction: transfer 10k mockWBTC to addr3
    await mockLINK.transfer(addr3.address, transferAmount);

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
      expect(await dauction.bidTokenToPriceFeed(mockUSDT.address)).to.eq(ZERO_ADDRESS);
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
      const [wethPrice, wethDecimals] = await dauction.getLatestPrice(WETH_USD);
      // Convert the price to a number and return it
      const formattedEthPrice = convertPriceToNumber(Number(wethPrice), wethDecimals);

       // assertion statement that WETH price is gte 1000 USD based on real-time exchange rate
      expect(formattedEthPrice).to.be.gte(1000);

      // // // WBTC/USD price
      const [wbtcPrice, wbtcDecimals] = await dauction.getLatestPrice(WBTC_USD);

      const formattedWbtcPrice = convertPriceToNumber(Number(wbtcPrice), wbtcDecimals);

     
      // assertion statement that WBTC price is gte 16000 USD based on real-time exchange rate
      expect(formattedWbtcPrice).to.be.gte(16000)

      //  LINK/USD price
      const [linkPrice, linkDecimals] = await dauction.getLatestPrice(LINK_USD);

      // const formattedLinkPrice =  Number((linkPrice.toString() / Math.pow(10, linkDecimals)).toFixed(2));
      const formattedLinkPrice = convertPriceToNumber(Number(linkPrice), linkDecimals);
      // assertion statement that LINK price is gte 6 USD based on real-time exchange rate
      expect(formattedLinkPrice).to.be.gte(6);

    })

    it("should return base price", async () => {
      const calculatedWethBasePrice = await dauction.calculateBasePrice(WETH_USD, 5);
      expect(calculatedWethBasePrice).to.be.gte(5000);

      const calculatedLinkBasePrice = await dauction.calculateBasePrice(LINK_USD, 5);
      expect(calculatedLinkBasePrice).to.be.gte(30);

    });
  })

  describe('Create Auction Validations', () => {
    it("should revert when auction creator is not nft owner", async () => {
      const FAIL_CASE = [nftContract.address, 1, 10, setTime(2), setTime(4), setTime(5)] as const;
      await expect(dauction.connect(addr2).createAuction(...FAIL_CASE))
        .to.be.revertedWith("not owner");
    });

    it("should revert when auction start time has passed", async () => {
      const FAIL_CASE = [nftContract.address, 1, 10, setTime(-1), setTime(4), setTime(5)] as const;
      await expect(dauction.connect(addr1).createAuction(...FAIL_CASE))
        .to.be.revertedWith("invalid auction start time");
    });

    it("should revert when auction min bid price is 0", async () => {
      const FAIL_CASE = [nftContract.address, 1, 0, setTime(1), setTime(4), setTime(5)] as const;
      await expect(dauction.connect(addr1).createAuction(...FAIL_CASE))
        .to.be.revertedWith("auction price cannot be zero");
    });

    it("should revert when auction duration is lesser than min duration(1 hour)", async () => {
      const FAIL_CASE = [nftContract.address, 1, 10, setTime(1), setTime(1.5), setTime(5)] as const;
      await expect(dauction.connect(addr1).createAuction(...FAIL_CASE))
        .to.be.revertedWith("invalid auction end time");
    });

    it("should revert when auction reveal time is before auction end time", async () => {
      const FAIL_CASE = [nftContract.address, 1, 10, setTime(1), setTime(4), setTime(3)] as const;
      await expect(dauction.connect(addr1).createAuction(...FAIL_CASE))
        .to.be.revertedWith("invalid reveal duration time");
    });

    it("should revert when the contract is not approved to transfer the auction nft", async () => {
      const CASE = [nftContract.address, 1, 10, setTime(1), setTime(3), setTime(4)] as const;
      await expect(dauction.connect(addr1).createAuction(...CASE))
        .to.be.revertedWith("ERC721: caller is not token owner nor approved");
    });

    it("should revert when an auction with the same nft address and id is active", async () => {
      const CASE = [nftContract.address, 1, 10, setTime(1), setTime(3), setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...CASE);
      await expect(dauction.connect(addr1).createAuction(...CASE))
        .to.be.revertedWith("not owner");
    });

    it("should successfully create auction and emit proper event", async () => {
      /* 
      CREATE ACTION PARAMS
        address nftContractAddress,
        uint256 tokenId,
        bidAmount,
        startTime,
        endTime, 
        revealDuration
    */
      const setMinBid = ethers.utils.parseEther('6')
      // array containing create auction params
      const AUCTION_PARAMS = [nftContract.address, 1, setMinBid , await setTime(2),
      await setTime(5), await setTime(6)] as const
      const [, , , start, end, revealTime] = AUCTION_PARAMS
      // approve dauction contract to use NFT
      await nftContract.connect(addr1).approve(dauction.address, 1);

      // nft owner create auction transaction
      const tx = dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      await expect (tx).to.emit(dauction, "AuctionCreated").withArgs(nftContract.address, toBN(1),
        addr1.address, toBN(setMinBid), start, end, revealTime, await setTime() + 1);
      // get auction details
      const auctionDetails = await dauction.auctions(AUCTION_PARAMS[0], AUCTION_PARAMS[1]);
      const { startTime, minBidPrice, endTime, revealDuration, auctionStatus, owner } = auctionDetails;

      expect(minBidPrice).to.eq(setMinBid); // expect minBidPrice to equal 5
      expect(auctionStatus).to.eq(1); // expect auctionStatus to equal 1 based on the set enum state
      expect((startTime)).to.eq(start); // expect start time to eq passed in start time
      expect((endTime)).to.eq(end); // expect start time to eq passed in end time
      expect((revealDuration)).to.eq(revealTime); // expect start time to eq passed in end duration time
      expect(owner).to.eq(addr1.address) // expect auction owner to equal address 1
      expect(await dauction.totalAuctions()).to.eq(1);
    });

  });

  describe("Create Bid", async () => {
    /* 
    CREATE BID PARAMS
      address nftContractAddress,
      uint256 tokenId,
      bytes32 bidCommitment,
      address bidToken
    */

    it("should revert bid on unauctioned NFT", async () => {

      const bidValue = 5;

      const BID_PARAMS = [dauction.address, 1, hashCommitmentParams(bidValue, createSalt(4555)), mockWETH.address] as const;

      await expect(dauction.connect(addr2).createBid(...BID_PARAMS)).to.be.revertedWith("non-existent auction item"); // revert addr2 attempt to create bid on unauctioned NFT

    })

    it("reverts when the bid token is invalid", async () => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(5), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      await expect(dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(5, createSalt(777)), ZERO_ADDRESS)).
        to.be.revertedWith("invalid bid token");
    });

    it("reverts attempt to bid with 0 bid commitment", async () => {

      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(5), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      await expect(dauction.connect(addr2).createBid(nftContract.address, 1, ZERO_BYTES_32, ZERO_ADDRESS)).
        to.be.revertedWith("zero bid commitment");
    });

    it("reverts deployer attempt to bid", async () => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(5), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      const BID_PARAMS = [nftContract.address, 1, hashCommitmentParams(5, createSalt(777)), mockWETH.address] as const

      await expect(dauction.connect(deployer).createBid(...BID_PARAMS)).to.be.revertedWith("deployer cannot bid");
    });

    it("reverts attempt to create bid when the auction has not started", async () => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(2), setTime(5), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);

      await expect(dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(5, createSalt(5000)), mockWETH.address)).
        to.be.revertedWith("auction has not started");
    });

    it("reverts auction owner attempt to bid", async () => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(2), setTime(5), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(3);

      await expect(dauction.connect(addr1).createBid(nftContract.address, 1, hashCommitmentParams(5, createSalt(5000)), mockWETH.address)).
        to.be.revertedWith("auction seller cannot bid");
    })

    it("reverts attempt to create bid when the auction has ended", async () => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(2), setTime(5), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);

      increaseBlockTimestamp(5);

      await expect(dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(5, createSalt(5000)), mockWETH.address)).
        to.be.revertedWith("auction has ended");
    });

    it("reverts when there is an existing bid from the bidder", async () => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(4), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(5, createSalt(5000)), mockWETH.address)
      await expect(dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(5, createSalt(5000)), mockWETH.address)).
        to.be.revertedWith("initialized bidCommitment");
    });

    it("reverts attempt to get bidders when no bid has been created", async () => {
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(4), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);

      await expect(dauction.getBidders(nftContract.address, 1)).
        to.be.revertedWith("no bids");
    });

    it("allows bidders to successfully create bid with appropriate bid parameters", async () => {
      const addr2Salt = 5000
      const addr3Salt = 33300

      const addr2BidValue = 5
      const addr3BidValue = 10
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(4), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);
      await dauction.connect(addr3).createBid(nftContract.address, 1, hashCommitmentParams(addr3BidValue, createSalt(addr3Salt)), mockLINK.address);
      expect(await dauction.getAuctionStatus(nftContract.address, 1)).to.eq("Bidded");
      const biddersArray = await dauction.getBidders(nftContract.address, 1);
      expect(biddersArray[0]).to.eq(addr2.address)
      expect(biddersArray[1]).to.eq(addr3.address)

      const addr2UnveilHash = unveilHashCommitment(addr2.address, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address)
      const addr3UnveilHash = unveilHashCommitment(addr3.address, hashCommitmentParams(addr3BidValue, createSalt(addr3Salt)), mockLINK.address)

      const { bidToken: addr2BidToken, bidCommitHash: addr2BidHash } = await dauction.getBid(nftContract.address, 1, addr2.address)
      expect(addr2BidToken).to.eq(mockWETH.address)
      expect(addr2BidHash).to.eq(addr2UnveilHash)

      const { bidToken: addr3BidToken, bidCommitHash: addr3BidHash } = await dauction.getBid(nftContract.address, 1, addr3.address)
      expect(addr3BidToken).to.eq(mockLINK.address)
      expect(addr3BidHash).to.eq(addr3UnveilHash)
    });

    it("emits BidCreated event after creating a bid", async () => {
      const addr2Salt = 5000
      const addr2BidValue = 5
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(4), setTime(6)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(2);
      const bidCommitment = hashCommitmentParams(addr2BidValue, createSalt(addr2Salt))
      const tx = dauction.connect(addr2).createBid(nftContract.address, 1, bidCommitment, mockWETH.address);
      await expect(tx).to.emit(dauction, "BidCreated")
        .withArgs(nftContract.address, 1, bidCommitment, await setTime(2) + 1)
    })
  })

  describe("Reveal Bid", async () => {
    /**
     * REVEAL BID PARAMS
        address nftAddress,
        uint256 tokenId,
        uint256 bidValue,
        bytes32 salt
     */
    it("reverts when bid value is 0", async () => {
      const addr2BidValue = 0;
      await expect(dauction.connect(addr1).revealBid(nftContract.address, 1, addr2BidValue, createSalt(20))).
        to.be.revertedWith("zero bid value");
    });

    it("reverts when bid is being revealed for an auction that doesn't exist", async () => {
      const addr2BidValue = 10;
      await expect(dauction.connect(addr1).revealBid(nftContract.address, 1, addr2BidValue, createSalt(20))).
        to.be.revertedWith("not in reveal phase");
    });

    it("reverts non-bidder attempt to reveal bid", async () => {
      const addr2Salt = 5000
      const addr2BidValue = 5
      const AUCTION_PARAMS = [nftContract.address, 1, 5, await setTime(1), await setTime(2), await setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(3);
      await expect(dauction.connect(addr1).revealBid(nftContract.address, 1, addr2BidValue, createSalt(addr2Salt))).
        to.be.revertedWith("no bid commitment");
    })

    it("should revert bidder attempt to reveal bid before reveal bid time", async () => {
      const addr2Salt = 5000

      const addr2BidValue = 5
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(2), setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);

      await mockWETH.connect(addr2).approve(dauction.address, parseEther('1000'))
      await expect(dauction.connect(addr2).revealBid(nftContract.address, 1, addr2BidValue, createSalt(addr2Salt))).
        to.be.revertedWith("not in reveal phase");
    })

    it("should revert bidder attempt to reveal bid after reveal bid time", async () => {
      const addr2Salt = 5000

      const addr2BidValue = 5
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(2), setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);
      increaseBlockTimestamp(8)

      await mockWETH.connect(addr2).approve(dauction.address, parseEther('1000'))
      await expect(dauction.connect(addr2).revealBid(nftContract.address, 1, addr2BidValue, createSalt(addr2Salt))).
        to.be.revertedWith("not in reveal phase");
    })

    it("should revert bidder attempt to reveal bid with no or insufficient bidToken balance", async () => {
      const addr2Salt = 5000

      const addr2BidValue = 5
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(2), setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await dauction.connect(addr4).createBid(nftContract.address, 1, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);
      increaseBlockTimestamp(2)

      await expect(dauction.connect(addr4).revealBid(nftContract.address, 1, addr2BidValue, createSalt(addr2Salt))).
        to.be.revertedWith("insuff token balance or approval");
    })

    it("should revert bidder attempt to reveal bid with low allowance set for dauction contract", async () => {
      const addr2Salt = 5000

      const addr2BidValue = parseEther('5')
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(2), setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);
      increaseBlockTimestamp(2)

      await mockWETH.connect(addr2).approve(dauction.address, parseEther('1'))
      await expect(dauction.connect(addr2).revealBid(nftContract.address, 1, addr2BidValue, createSalt(addr2Salt))).
        to.be.revertedWith("insuff token balance or approval");
    })

    it("should revert bidder attempt to reveal bid with invalid reveal bid params", async () => {
      const addr2Salt = 5000

      const addr2BidValue = parseEther('5')
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(2), setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);
      increaseBlockTimestamp(2)

      await mockWETH.connect(addr2).approve(dauction.address, addr2BidValue)
      await expect(dauction.connect(addr2).revealBid(nftContract.address, 1, addr2BidValue, createSalt(2))).
        to.be.revertedWith("invalid bid hash");
    })


    it("should successfully reveal bid", async () => {
      const addr2Salt = 5000

      const addr2BidValue = parseEther('5')
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(2), setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      
      await dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);
      increaseBlockTimestamp(2)

      await mockWETH.connect(addr2).approve(dauction.address, addr2BidValue);
      
      await dauction.connect(addr2).revealBid(nftContract.address, 1, addr2BidValue, createSalt(addr2Salt));

      const { amountBidded } = await dauction.getBid(nftContract.address, 1, addr2.address);
      expect(amountBidded).to.eq(addr2BidValue);
      expect(await dauction.getAuctionStatus(nftContract.address, 1)).to.eq("Revealed");
      const addr2RevealHash = unveilHashCommitment(addr2.address, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);

      // check emitted event BidReveal 
      await expect(dauction.connect(addr2).revealBid(nftContract.address, 1, addr2BidValue, createSalt(addr2Salt)))
        .to.emit(dauction, "BidRevealed")
        .withArgs(nftContract.address, 1, addr2RevealHash, addr2.address, createSalt(addr2Salt), addr2BidValue);
    });
  });



  describe("Settle Auction", async () => {
    /**
    * SETTLE BID PARAMS
       address nftAddress,
       uint256 tokenId
    */
    it("should revert non-auctioneer attempt to settle auction", async () => {
      const addr2Salt = 5000;

      const addr2BidValue = parseEther('5');
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(2), setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await dauction.connect(addr2).createBid(nftContract.address, 1,
        hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);
      increaseBlockTimestamp(2);

      await mockWETH.connect(addr2).approve(dauction.address, addr2BidValue)
      await dauction.connect(addr2).revealBid(nftContract.address, 1, addr2BidValue, createSalt(addr2Salt))
      await expect(dauction.connect(addr2).settleAuction(nftContract.address, 1)).
        to.be.revertedWith("not auction owner");
    })

    it("should revert auctioneer attempt to settle auction when reveal duration has not elapsed", async () => {
      const addr2Salt = 5000

      const addr2BidValue = parseEther('5')
      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(2), setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);
      await dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);
      increaseBlockTimestamp(2)

      await mockWETH.connect(addr2).approve(dauction.address, addr2BidValue)
      await dauction.connect(addr2).revealBid(nftContract.address, 1, addr2BidValue, createSalt(addr2Salt))
      await expect(dauction.connect(addr1).settleAuction(nftContract.address, 1)).
        to.be.revertedWith("reveal phase not over");
    })


    it("should transfer nft back to auctioneer when no bid exist at the elapse of the auction when auction is settled",
      async () => {
        const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(2), setTime(4)] as const;
        await nftContract.connect(addr1).approve(dauction.address, 1);
        await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);

        increaseBlockTimestamp(4);
        expect(await nftContract.ownerOf(1)).to.eq(dauction.address);
        await expect(dauction.connect(addr1).settleAuction(nftContract.address, 1)).to.emit
          (dauction, "AuctionUnsettled").withArgs(nftContract.address, 1, addr1.address, anyValue);

        expect(await nftContract.ownerOf(1)).to.eq(addr1.address);
        // nft owner balance remains unchanged
        expect(await mockWBTC.balanceOf(addr1.address)).to.eq(parseEther('10000'));
        expect(await mockWETH.balanceOf(addr1.address)).to.eq(parseEther('10000'));
        expect(await mockLINK.balanceOf(addr1.address)).to.eq(parseEther('10000'));
        expect(await mockUSDT.balanceOf(addr1.address)).to.eq(parseEther('10000'));

        // revert attempt to call getBid since no bid exists
        await expect(dauction.getBid(nftContract.address, 1, addr2.address)).to.be.revertedWith("no bids");

        // get auction details
        const auctionDetails = await dauction.auctions(AUCTION_PARAMS[0], AUCTION_PARAMS[1]);
        const { startTime, minBidPrice, endTime, revealDuration, auctionStatus, owner } = auctionDetails

      // reset auction struct
        expect(owner).to.eq(ZERO_ADDRESS);
        expect(startTime).to.eq(0)
        expect(minBidPrice).to.eq(0)
        expect(endTime).to.eq(0)
        expect(revealDuration).to.eq(0)
        expect(auctionStatus).to.eq(0)

      });


    it("should settle only based on revealed bids, determine highest bidders and settle auction accordingly", async () => {
      // deployer transfer 1k mockUSDT to addr4
      await mockLINK.transfer(addr4.address, parseEther("10000"));

      // deployer transfer 10k mockUSDT to addr5
      await mockUSDT.transfer(addr5.address, parseEther("10000"));


      const addr2Salt = 5000
      const addr3Salt = 777
      const addr4Salt = 777
      const addr5Salt = 777

      const addr2BidValue = parseEther('1');
      const addr3BidValue = parseEther('0.5');
      const addr4BidValue = parseEther('1500');
      const addr5BidValue = parseEther('10000');

      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(2), setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);

      await dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);
      await dauction.connect(addr3).createBid(nftContract.address, 1, hashCommitmentParams(addr3BidValue, createSalt(addr3Salt)), mockWBTC.address);
      await dauction.connect(addr4).createBid(nftContract.address, 1, hashCommitmentParams(addr4BidValue, createSalt(addr4Salt)), mockLINK.address);
      await dauction.connect(addr5).createBid(nftContract.address, 1, hashCommitmentParams(addr5BidValue, createSalt(addr5Salt)), mockUSDT.address);
      increaseBlockTimestamp(2)



      await mockWETH.connect(addr2).approve(dauction.address, MAX_UINT256);
      await mockWBTC.connect(addr3).approve(dauction.address, MAX_UINT256);
      await mockLINK.connect(addr4).approve(dauction.address, MAX_UINT256);
      await mockUSDT.connect(addr5).approve(dauction.address, MAX_UINT256);


      await dauction.connect(addr2).revealBid(nftContract.address, 1, addr2BidValue, createSalt(addr2Salt)); // addr2 reveals bid
      await dauction.connect(addr3).revealBid(nftContract.address, 1, addr3BidValue, createSalt(addr3Salt)); // addr3 reveals bid
      await dauction.connect(addr4).revealBid(nftContract.address, 1, addr4BidValue, createSalt(addr4Salt)); // addr4 reveals bid

      increaseBlockTimestamp(10);

      await dauction.connect(addr1).settleAuction(nftContract.address, 1); // addr1 settles auction

      const nftNewOwner = await nftContract.ownerOf(1)
      
      // addr5 is the higest bidder
      // given that addr5 did not reveal his bid, addr4 being the second highest bidder is now the bidder of the bid
      expect(nftNewOwner).to.eq(addr4.address);
      // auctioneer balance post auction settlement
      expect(await mockLINK.balanceOf(addr1.address)).to.eq(parseEther('11500')); // link balance should increase
      expect(await mockLINK.balanceOf(addr4.address)).to.eq(parseEther('8500')); 
      expect(await mockWETH.balanceOf(addr1.address)).to.eq(parseEther('10000'));
      expect(await mockWBTC.balanceOf(addr1.address)).to.eq(parseEther('10000'));
      expect(await mockUSDT.balanceOf(addr1.address)).to.eq(parseEther('10000'));

      // get auction details
      const auctionDetails = await dauction.auctions(AUCTION_PARAMS[0], AUCTION_PARAMS[1])
      const { startTime, minBidPrice, endTime, revealDuration, auctionStatus, owner } = auctionDetails
      expect(owner).to.eq(ZERO_ADDRESS);
      expect(startTime).to.eq(0);
      expect(minBidPrice).to.eq(0);
      expect(endTime).to.eq(0);
      expect(revealDuration).to.eq(0);
      expect(auctionStatus).to.eq(0);

      // revert attempt to call getBid since auction props no longer exists
      await expect(dauction.getBid(nftContract.address, 1, addr2.address)).to.be.revertedWith("no bids");
    })

    it("should allow auctioneer to successfully settle auction", async () => {
      // deployer transfer 1k mockUSDT to addr4
      await mockLINK.transfer(addr4.address, parseEther("1000"));

      // deployer transfer 10k mockUSDT to addr5
      await mockUSDT.transfer(addr5.address, parseEther("10000"));


      const addr2Salt = 5000;
      const addr3Salt = 777;
      const addr4Salt = 777;
      const addr5Salt = 777;

      const addr2BidValue = parseEther('2');
      const addr3BidValue = parseEther('0.1');

      const addr4BidValue = parseEther('800');
      const addr5BidValue = parseEther('10000');

      const AUCTION_PARAMS = [nftContract.address, 1, 5, setTime(1), setTime(2), setTime(4)] as const;
      await nftContract.connect(addr1).approve(dauction.address, 1);
      await dauction.connect(addr1).createAuction(...AUCTION_PARAMS);
      increaseBlockTimestamp(1);

      await dauction.connect(addr2).createBid(nftContract.address, 1, hashCommitmentParams(addr2BidValue, createSalt(addr2Salt)), mockWETH.address);
      await dauction.connect(addr3).createBid(nftContract.address, 1, hashCommitmentParams(addr3BidValue, createSalt(addr3Salt)), mockWBTC.address);
      await dauction.connect(addr4).createBid(nftContract.address, 1, hashCommitmentParams(addr4BidValue, createSalt(addr4Salt)), mockLINK.address);
      await dauction.connect(addr5).createBid(nftContract.address, 1, hashCommitmentParams(addr5BidValue, createSalt(addr5Salt)), mockUSDT.address);
      increaseBlockTimestamp(2);
      
      await mockWETH.connect(addr2).approve(dauction.address, MAX_UINT256);
      await mockWBTC.connect(addr3).approve(dauction.address, MAX_UINT256);
      await mockLINK.connect(addr4).approve(dauction.address, MAX_UINT256);
      await mockUSDT.connect(addr5).approve(dauction.address, MAX_UINT256);
      
      await dauction.connect(addr2).revealBid(nftContract.address, 1, addr2BidValue, createSalt(addr2Salt)); // addr2 reveals bid
      await dauction.connect(addr3).revealBid(nftContract.address, 1, addr3BidValue, createSalt(addr3Salt)); // addr3 reveals bid
      await dauction.connect(addr4).revealBid(nftContract.address, 1, addr4BidValue, createSalt(addr4Salt));
      await dauction.connect(addr5).revealBid(nftContract.address, 1, addr5BidValue, createSalt(addr5Salt));
      increaseBlockTimestamp(10);
      
      const tx = dauction.connect(addr1).settleAuction(nftContract.address, 1); // addr1 settles auction
      await expect(tx).to.emit(dauction, "AuctionSettled").withArgs(nftContract.address, 1, 
        addr1.address, addr5.address, addr5BidValue, anyValue);

                     
      expect(await nftContract.ownerOf(1)).to.eq(addr5.address);

      // auctioneer balance post auction settlement
      expect(await mockUSDT.balanceOf(addr1.address)).to.eq(parseEther('20000'));
      expect(await mockUSDT.balanceOf(addr5.address)).to.eq(parseEther('0'));


      // get auction details
      const auctionDetails = await dauction.auctions(AUCTION_PARAMS[0], AUCTION_PARAMS[1]);
      const { startTime, minBidPrice, endTime, revealDuration, auctionStatus, owner } = auctionDetails;
      expect(owner).to.eq(ZERO_ADDRESS);
      expect(startTime).to.eq(0);
      expect(minBidPrice).to.eq(0);
      expect(endTime).to.eq(0);
      expect(revealDuration).to.eq(0);
      expect(auctionStatus).to.eq(0);

      // revert attempt to call getBid since auction props no longer exists
      await expect(dauction.getBid(nftContract.address, 1, addr2.address)).to.be.revertedWith("no bids");
    });

  });
});

