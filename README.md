
#  Dauction  - Decentralized Auction

This is a decentralized auction project that allows users to auction their assets. Using a sealed bid mechanism, `ERC721` tokens, otherwise referred to as NFTs, represent this asset, allowing bidders to bid without revealing the value of their bid until the end of a given auction period as specified by the seller. At the elapse of a given auction period, the highest bid would be unveiled and allowed to purchase the auctioned asset.


## Problem Statement
We intend to solve the problem surrounding the privacy of auction bids and the common approach where most bids are submitted using a single asset. 


## Our Solution
- `Privacy` - by implementing seal-bids, bidders are guaranteed that: 
  - their bids are kept private until the reveal bid phase is reached as specified by the auctioneer when creating the auction. 
  - their respective auctions cannot be censored

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
Bidders can only create bids for a valid NFT asset for which an auction has been successfully created. Bids are sent with the following parameters: 
  - `nftContractAddress` - address of the NFT asset
  - `tokenId` - unique ID of the NFT asset
  - `bidCommitment` - a hashed combination of bidders' `bidValue` and `salt` (which serves as an extra layer to further make it difficult to guess)
  - `bidToken` - address of the token a bidder intends to bid with
  - As the auction `startTime` elapses, bidders, can proceed to reveal their respective bids

##### Reveal Bid
At the elapse of the end bid time is the reveal bid phase where bidders can unhash the value of their bids with the following parameters:
 - `nftAddress` - address of the NFT asset,
 - `tokenId` - unique ID of the NFT
 - `bidValue` - the amount of tokens bided with
 - `salt` - random number to further hash a bidder's bid commitment 
       


##### Settle Auction
Following the submission and revealing of bids by bidders, an auctioneer proceeds to settle the auction. This ensures the determination of the `highestBidder` and the value of the `highestBid` based on token-USD exchange rate in real-time as calculated using Chainlink's price feed. 

A bid is considered successful if after being revealed, it is determined that its USD value is not lower than the auction's minimum bid price specification. In this case, the NFT asset is transferred to the highest bidder while the highest bidder's amount of tokens is transferred to the auctioneer.

On the other hand, in the event of an unsuccessful bid, the NFT asset is transferred back to the auctioneer in the following cases:
- no bid was created for a given auction
- the USD value of a given bid is lower than the amount specified by the auctioneer as the minimum bid price


### Deployed Polygon Mumbai Contracts

- [MockUSDT](https://mumbai.polygonscan.com/token/0xF5F052f062c91eE3D8604e888C294313c2cbFc80)
- [MockLINK](https://mumbai.polygonscan.com/token/0x80022d32165A3a4a030393F9676fAe73BA378221)
- [MockWETH](https://mumbai.polygonscan.com/token/0x98588b914e64d0C03198e7B0c56D505aeeb65397)
- [MockWBTC](https://mumbai.polygonscan.com/token/0xb3E401DB5382f786D1Ab5ccB7279004D47038422)
- [DauctionNFT](https://mumbai.polygonscan.com/address/0xfc1ea6cc05d13650a1aceb1d08c44b4e3258a9c7)
- [Dauction Marketplace Contract](https://mumbai.polygonscan.com/address/0x5Cf3c6435BEe8d61B2799501CB9EcB586774c51f)


### Test
Run `npm run test`

## What's next for Dauction 
