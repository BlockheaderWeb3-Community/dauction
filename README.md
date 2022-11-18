# Decentralized Auction (Dauction)

This is a decentralized auction project that allow users to auction their assets. Using sealed bid mechanism, `ERC721` tokens otherwise referred to as NFTs, represent this asset which allow bidders to bid without revealing the value of their bid until the end of a given auction period as specified by the seller. At the elapse of a given auction period, the highest bid would be unveiled and allowed to purchase the auctioned asset.


## Problem Statement
We intend to solve the problem surrounding the privacy of auction bids and the common approach where most bids are submitted using a single asset. 


## Our Solution
- `Privacy` - by implementing seal-bids, bidders are guaranteed that: 
  - their bids are kept private until the reveal bid phase is reached as specified by the auctioneer when creating auction. 
  - their respectives cannot be censored

- `Multi-token Bids` - our solution offers bidders an opportunity to bid with multiple tokens other than the conventional approach of bidding with a specific auction platform-defined asset. The logic that determines the selection of the highest bidder and the USD value of the highest bid is correctly evaluated by leveraging Chainlink's battle-tested price feeds thus enabling us to support the use of following ERC20 tokens as bid tokens:
  - `Chainlink token - LINK`
  - `Wrapped Ether - WETH`
  - `Wrapped BTC - WBTC`
  - `Tether - USDT`



### Business Logic
---
##### Create Auction
To create an auction, the auctioneer will first approves NFT by calling `approve` function in DauctionNFT with the following arguments:
    - `to` - DauctionNFT address
    - `tokenId` - unique ID of NFT asset
Having granted `Dauction` contract approval to use the NFT, an auctioneer (NFT owner) initiates the auction with the following parameters (cannot participate in this auction)
  - `_nftAddress` - address of the NFT asset
  - `tokenId` - unique ID of the NFT asset
  - `minBidPrice` - the minimum amount the owner intends to sell his asset
  - `_startTime` - the time specified by seller as commencement of auction
  - `endTime` - the specified auction-end time by the seller/owner of NFT
  - `_revealDuration` - the time specified by the seller as the timeframe for which all bidders must reveal the value of their bids



##### Create Bid
Bidders can only create bid for a valid NFT asset for which auction has been successfully created. Bids are sent with the following parameters: 
  - `nftContractAddress` - address of the NFT asset
  - `tokenId` - unique ID of the NFT asset
  - `bidCommitment` - hashed combination of bidders' `bidValue` and `salt` (which serves as an extra layer to further make it difficult to guess)
  - `bidToken` - address of the token a bidder intends to bid with
  - As the auction `startTime` elapses, bidders can proceed to reveal their respective bids

##### Reveal Bid
At the elapse of the end bid time, is the reveal bid phase where bidders can unhash the value of their bids with the following parameters:
 - `nftAddress` - address of the NFT asset,
 - `tokenId` - unique ID of the NFT
 - `bidValue` -  amount of tokens bidded with
 - `salt` - random number to further hash a bidder's bid commitment 
       


##### Settle Auction
Following the submission and revealing of bids by bidders, an auctioneer proceeds to settle the auction. This ensures the determination of the `highestBidder` and the value of the `highestBid` based on token-USD exchange rate in real-time as calculated using Chainlink's price feed. 

A bid is considered successful if after being revealed, it is determined that its USD value is not lower than the auction's minimum bid price specification. In this case, the NFT asset is transferred to the highest bidder while the highest bidder's amount of tokens is transferred to the auctioneer.

On the other hand, in the event of an unsuccessful bid, the NFT asset is transferred back to the auctioneer in the following cases:
- no bid was created for a given auction
- the USD value of a given bid is lower than the amount specified by the auctioneer as the minimum bid price

## Steps

### Deployed Goerli Contracts

- [MockUSDT](https://goerli.etherscan.io/token/0x289bc9A76ADbF81746db9A8e99DdF6776d41D84b)
- [MockLINK](https://goerli.etherscan.io/token/0xda469e02e3d939c3ffafa5e8bf9569ccffe8da0d)
- [MockWETH](https://goerli.etherscan.io/token/0x5db5a283bdebf69a9e779e7fef7d6616b02dffe6)
- [MockWBTC](https://goerli.etherscan.io/token/0x5df75ff8fe3fcbbf056db82ad5b6c96aa5044964)
- [DauctionNFT](https://goerli.etherscan.io/token/0x17d76D5776505eD9F60030eb8744B88A96ff9e84)
- [Dauction Marketplace Contract](https://goerli.etherscan.io/address/0x67fd942138ea7d117971944b88d8d80b08c9d2e9)


### Test
Run `npm run test`
