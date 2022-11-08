# Decentralized Auction (Dauction)

---
This is a decentralized auction project that allow users to auction their assets. Using sealed bid mechanism, `ERC721` tokens otherwise referred to as NFTs, represent this asset and allows bidders to bid without revealing the value of their bid until the end of a given auction period as specified by the seller. At the elapse of a given auction period, the highest bid would be unveiled and allowed to purchase the auctioned asset.

### Business Logic

- [x] Auctioneer (NFT owner) initiates the auction at any time with the following parameters (cannot participate in this auction)
  - `_nftAddress` - address of the NFT asset
  - `tokenId` - unique ID of the NFT asset
  - `minBidPrice` - the minimum amount the owner intends to sell his asset
  - `_startTime` - the time specified by seller as commencement of auction
  - `endTime` - the specified auction-end time by the seller/owner of NFT
  - `_revealDuration` - the time specified by the seller as the timeframe for which all bidders must reveal the value of their bids
- [x] Bidders can only create bid for a valid token for which auction has been successfully created 
- [x] Bidders cannot withdraw bid until the end of the auction



### Test
Run `npm run test`
