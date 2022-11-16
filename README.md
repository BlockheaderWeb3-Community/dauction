# Decentralized Auction (Dauction)

This is a decentralized auction project that allow users to auction their assets. Using sealed bid mechanism, `ERC721` tokens otherwise referred to as NFTs, represent this asset which allow bidders to bid without revealing the value of their bid until the end of a given auction period as specified by the seller. At the elapse of a given auction period, the highest bid would be unveiled and allowed to purchase the auctioned asset.

## Project Overview 

## Problem Statement
We intend to solve a problem surrounding the privacy of auction bids. By implementing seal-bids, bidders are guaranteed that: 
- their bids are kept private until the reveal bid phase as specified by the auctioneer when creating bids. 
- their respectives cannot be censored
- the logic that determines the selection of the highest bidder is correctly evaluated via Chainlink's battle-tested price feeds
  
Our solution allows bidders to bid using different tokens: 
  - `Chainlink token - LINK`
  - `Wrapped Ether - WETH`
  - `Wrapped BTC - WBTC`
  - `Tether - USDT`

### Business Logic

##### Create Auction
To proceed, to create an auction, the auctioneer will approves NFT by calling `approve` function in DauctionNFT with the following arguments:
    - `to` - DauctionNFT address
    - `tokenId` - unique ID of NFT asset
Auctioneer (NFT owner) initiates the auction at any time with the following parameters (cannot participate in this auction)
  - `_nftAddress` - address of the NFT asset
  - `tokenId` - unique ID of the NFT asset
  - `minBidPrice` - the minimum amount the owner intends to sell his asset
  - `_startTime` - the time specified by seller as commencement of auction
  - `endTime` - the specified auction-end time by the seller/owner of NFT
  - `_revealDuration` - the time specified by the seller as the timeframe for which all bidders must reveal the value of their bids

---

##### Create Bid
Bidders can only create bid for a valid NFT asset for which auction has been successfully created. Bids are sent with the following parameters: 
  - `nftContractAddress` - address of the NFT asset
  - `tokenId` - unique ID of the NFT asset
  - `bidCommitment` - hashed combination of bidders' `bidValue` and `salt` (which serves as an extra layer to further make it difficult to guess)
  - `bidToken` - address of the token a bidder intends to bid with
- [x] As the auction `startTime` elapses, bidders can proceed to reveal their respective bids
- [ ] 

## Steps
-
- 
### Deployed Goerli Contracts

- [MockUSDT](https://goerli.etherscan.io/token/0x289bc9A76ADbF81746db9A8e99DdF6776d41D84b)
- [MockLINK](https://goerli.etherscan.io/token/0xda469e02e3d939c3ffafa5e8bf9569ccffe8da0d)
- [MockWETH](https://goerli.etherscan.io/token/0x5db5a283bdebf69a9e779e7fef7d6616b02dffe6)
- [MockWBTC](https://goerli.etherscan.io/token/0x5df75ff8fe3fcbbf056db82ad5b6c96aa5044964)
- [DauctionNFT](https://goerli.etherscan.io/token/0x17d76D5776505eD9F60030eb8744B88A96ff9e84)
- [Dauction Marketplace Contract](https://goerli.etherscan.io/address/0x67fd942138ea7d117971944b88d8d80b08c9d2e9)


### Test
Run `npm run test`
