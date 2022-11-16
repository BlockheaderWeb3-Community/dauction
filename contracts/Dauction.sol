//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Dauction is ReentrancyGuard {
    using SafeERC20 for IERC20;
    // @dev rep
    struct BidTokens {
        address token;
        address priceFeed;
    }
    mapping(address => address) public bidTokenToPriceFeed;

    BidTokens[] public bidTokens;

    uint256 public totalAuctions;

    uint256 public constant MIN_AUCTION_PERIOD = 60 minutes;

    address immutable USDT;
    
    // bidder's props
    struct Bid {
        uint256 amountBidded;
        bytes32 bidCommitHash;
        address bidToken;
    }

    // auction struct for seller
    struct Auction {
        address payable owner;
        uint256 startTime;
        uint256 minBidPrice;
        uint256 endTime;
        uint256 revealDuration;
        AuctionStatus auctionStatus;
        mapping(address => Bid) bids; //
        address[] bidders;
    }

    // state of auction
    enum AuctionStatus {
        Unassigned,
        Initiated,
        Bidded,
        Revealed,
        Executed,
        Unexecuted
    }

    mapping(address => mapping(uint256 => Auction)) public auctions; // mapping NFT address to tokenId as key, Auctions == values

    event AuctionCreated(
        address nft,
        uint256 tokenId,
        address seller,
        uint256 minBidPrice,
        uint256 startTime,
        uint256 endTime,
        uint256 revealDuration,
        uint256 auctionCreatedAt
    );

    event BidCreated(
        address nftContractAddress,
        uint256 tokenId,
        bytes32 bidCommitment,
        uint256 biddedAt
    );

    event BidRevealed(
        address tokenContract,
        uint256 tokenId,
        bytes32 bidHash,
        address bidder,
        bytes32 salt,
        uint256 bidValue
    );
    event AuctionUnsettled(
        address nftAddress,
        uint256 tokenId,
        address owner,
        uint256 time
    );
    event AuctionSettled(
        address nftAddress,
        uint256 tokenId,
        address previousOwner,
        address newOwner,
        uint256 tokenAmountPaid
    );

    // instantiate the constructor with LINK, WETH, WBTC and USDT addresses

    // BidTokens[] public bidTokenParamsArray;
    address deployer;

    constructor(BidTokens[] memory bidTokensArray, address _USDT) {
        // BidTokens memory bidTokensMemoryArray;
        for (uint256 i; i < bidTokensArray.length; i++) {
            bidTokenToPriceFeed[bidTokensArray[i].token] = bidTokensArray[i]
                .priceFeed;
        }
        USDT = _USDT;
        deployer = msg.sender;
    }

    /**
     * @dev anyone can create auction
     * @param _nftAddress address of the auctioned NFT
     * @param _tokenId unique ID of the auctioned NFT asset
     * @param _minBidPrice minimum threshold amount for the auctioned NFT
     * @param _startTime time of commencement of bid
     * @param _endTime expected time an auction should end
     * @param _revealDuration valid period within which all bidders must reveal their bid

     */

    function createAuction(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _minBidPrice,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _revealDuration
    ) public nonReentrant {
        IERC721 nftContract = IERC721(_nftAddress);
        require(msg.sender == nftContract.ownerOf(_tokenId), "not owner");
        require(_startTime >= block.timestamp, "invalid auction start time");
        require(_minBidPrice > 0, "auction price cannot be zero");
        require(
            _endTime >= _startTime + MIN_AUCTION_PERIOD,
            "invalid auction end time"
        );
        require(_revealDuration > _endTime, "invalid reveal duration time");

        Auction storage auction = auctions[_nftAddress][_tokenId];
        require(auction.endTime == 0, "auction already exist");

        auction.owner = payable(msg.sender);
        auction.minBidPrice = _minBidPrice;
        auction.auctionStatus = AuctionStatus.Initiated;
        auction.startTime = _startTime; // time for auction start
        auction.endTime = _endTime;
        auction.revealDuration = _revealDuration;
        totalAuctions = totalAuctions + 1;

        nftContract.transferFrom(msg.sender, address(this), _tokenId);

        emit AuctionCreated({
            nft: _nftAddress,
            tokenId: _tokenId,
            seller: msg.sender,
            minBidPrice: _minBidPrice,
            startTime: auction.startTime,
            endTime: _endTime,
            revealDuration: _revealDuration,
            auctionCreatedAt: block.timestamp
        });
    }

    /**
     * @dev anyone except deployer and auctioneer can create bid 
     * @param nftContractAddress address of the auctioned NFT
     * @param tokenId unique ID of the auctioned NFT asset
     * @param bidCommitment unique hash of a given bid
     * @param bidToken address of the token user intends to bid with

     */
    function createBid(
        address nftContractAddress,
        uint256 tokenId,
        bytes32 bidCommitment,
        address bidToken
    ) external nonReentrant {
        Auction storage auction = auctions[nftContractAddress][tokenId];
        require(auction.owner != address(0), "non-existent auction item");

        require(msg.sender != deployer, "deployer cannot bid");

        require(bidCommitment != bytes32(0), "zero bid commitment");

        require(
            bidTokenToPriceFeed[bidToken] != address(0) ||
                checkBidTokenUSDTEquivalence(bidToken),
            "invalid bid token"
        );

        require(
            block.timestamp >= auction.startTime,
            "auction has not started"
        );
        require(msg.sender != auction.owner, "auction seller cannot bid");

        require(auction.endTime >= block.timestamp, "auction has ended");

        Bid storage bid = auction.bids[msg.sender];
        require(bid.bidCommitHash == bytes32(0), "initialized bidCommitment");

        bid.bidCommitHash = _hashBidAmount(msg.sender, bidCommitment, bidToken); // hash the bid
        auction.auctionStatus = AuctionStatus.Bidded;

        bid.bidToken = bidToken;
        auction.bidders.push(msg.sender);

        emit BidCreated(
            nftContractAddress,
            tokenId,
            bidCommitment,
            block.timestamp
        );
    }

    /**
     * @dev allows only bidder can reveal bid
     * @param nftAddress address of the auctioned NFT
     * @param tokenId unique ID of the auctioned NFT asset
     * @param bidValue user-specified bid amount
     * @param salt unique hash added to conseal bid commitment
     */
    function revealBid(
        address nftAddress,
        uint256 tokenId,
        uint256 bidValue,
        bytes32 salt
    ) external {
        require(bidValue != 0, "zero bid value");
        Auction storage auction = auctions[nftAddress][tokenId];

        require(
            block.timestamp >= auction.endTime &&
                block.timestamp <= auction.revealDuration,
            "not in reveal phase"
        );

        Bid storage bid = auction.bids[msg.sender];
        require(bid.bidCommitHash != bytes32(0), "no bid commitment");
        address bidToken = bid.bidToken;

        require(
            IERC20(bidToken).balanceOf(msg.sender) >= bidValue,
            "insuff token bal"
        );

        require(
            IERC20(bidToken).allowance(msg.sender, address(this)) >= bidValue,
            "low token allowance"
        );

        bytes32 verifyCommitHash = _hashBidAmount(
            msg.sender,
            keccak256(abi.encodePacked(bidValue, salt)),
            bidToken
        );

        require(verifyCommitHash == bid.bidCommitHash, "invalid bid hash");

        bid.amountBidded = bidValue;
        auction.auctionStatus = AuctionStatus.Revealed;

        emit BidRevealed(
            nftAddress,
            tokenId,
            verifyCommitHash,
            msg.sender,
            salt,
            bidValue
        );
    }

    /**
     * @dev allows only auctioneer to delete auction
     * @param _nftContractAddress address of the auctioned NFT
     * @param _tokenId unique ID of the auctioned NFT asset
     */
    function deleteAuction(address _nftContractAddress, uint256 _tokenId)
        private
    {
        Auction storage auction = auctions[_nftContractAddress][_tokenId];
        // require(msg.sender == auction.owner, "not auction owner");
        Bid memory bid = auction.bids[address(0)];
        for (uint256 i; i < auction.bidders.length; i++) {
            auction.bids[auction.bidders[i]] = bid;
        }
        delete auctions[_nftContractAddress][_tokenId];
    }

    /**
     * @dev allows only auctioneer to settle auction
     * @param nftAddress address of the auctioned NFT
     * @param tokenId unique ID of the auctioned NFT asset
     */
    function settleAuction(address nftAddress, uint256 tokenId) external {
        Auction storage auction = auctions[nftAddress][tokenId];
        require(msg.sender == auction.owner, "not auction owner");
        // check that the reveal time has elapsed
        require(
            block.timestamp > auction.revealDuration,
            "reveal phase not over"
        );

        address bidder;
        uint256 bidAmount;
        uint256 highestBidAmount;
        address highestBidder;
        for (uint256 i; i < auction.bidders.length; i++) {
            bidder = auction.bidders[i];
            Bid memory bid = auction.bids[bidder];

            if (bid.amountBidded == 0) {
                continue;
            }
            bidAmount = bid.amountBidded;
            address selectedBidToken = bid.bidToken;

            uint256 formattedPrice = checkBidTokenUSDTEquivalence(
                selectedBidToken
            )
                ? bidAmount
                : calculateBasePrice(
                    bidTokenToPriceFeed[selectedBidToken],
                    bidAmount
                );

            if (formattedPrice > highestBidAmount) {
                highestBidAmount = formattedPrice;
                highestBidder = bidder;
            }
        }

        // if highest address is 0 or bid amount < min bid price , transfer nft to seller
        if (
            highestBidder == address(0) ||
            highestBidAmount < auction.minBidPrice
        ) {
            auction.owner = payable(msg.sender);
            auction.auctionStatus = AuctionStatus.Unexecuted;
            IERC721(nftAddress).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId
            );

            deleteAuction(nftAddress, tokenId);

            emit AuctionUnsettled(
                nftAddress,
                tokenId,
                msg.sender,
                block.timestamp
            );
        } else {
            // transfer token to auction owner
            Bid memory bid = auction.bids[highestBidder];
            IERC20(bid.bidToken).transferFrom(
                highestBidder,
                msg.sender,
                bid.amountBidded
            );
            // transfer NFT to highest bidder
            IERC721(nftAddress).safeTransferFrom(
                address(this),
                highestBidder,
                tokenId
            );

            // emit SettleAuction event
            emit AuctionSettled(
                nftAddress,
                tokenId,
                msg.sender,
                highestBidder,
                highestBidAmount
            );
        }
        deleteAuction(nftAddress, tokenId);
    }

    /********************************************************************************************/
    /*                                      UTILITY FUNCTIONS                                  */
    /******************************************************************************************/

    /**
     * @dev Returns the latest price and decimals of a given bid token - WETH, WBTC and LINK - when the appropriate aggregator address is passed in
     */

    function getLatestPrice(address _priceFeed)
        public
        view
        returns (int256, uint8)
    {
        (
            ,
            /*uint80 roundID*/
            int256 price, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = AggregatorV3Interface(_priceFeed).latestRoundData();

        // get priceFeed decimals
        uint8 decimals = AggregatorV3Interface(_priceFeed).decimals();
        return (price, decimals);
    }

    // utility function to calculate base price
    function calculateBasePrice(address _priceFeed, uint256 bidAmount)
        public
        view
        returns (uint256)
    {
        (int256 price, uint8 decimals) = getLatestPrice(_priceFeed);
        // return price / int256(10**decimals);
        return (bidAmount * uint256(price)) / (10**decimals);
    }

    function getBidTokens() public view returns (BidTokens[] memory) {
        return bidTokens;
    }

    /**
     * @dev determines the priceFeed address to be used based on the bid token selected by the bidder
     * @param _bidToken address of a given bid token
     * @return address of the appropriate priceFeed based on the bidToken params
     */
    function checkBidTokenUSDTEquivalence(address _bidToken)
        public
        view
        returns (bool)
    {
        return _bidToken == USDT ? true : false;
    }

    /**
     * @dev generates a unique identity for a bidders commitment onchain
     * @param account address of a given bid token
     * @param commitment encrypted hash by bidder
     * @param bidToken the specified bid token by bidder
     * @return the hash of the passed in params
     */

    function _hashBidAmount(
        address account,
        bytes32 commitment,
        address bidToken
    ) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(account, commitment, bidToken));
    }

    function getMinBidPrice(address nftAddress, uint256 tokenId)
        public
        view
        returns (uint256)
    {
        return auctions[nftAddress][tokenId].minBidPrice;
    }

    function getAuctionStatus(address nftAddress, uint256 tokenId)
        public
        view
        returns (string memory _auctionStatus)
    {
        uint8 auctionState = uint8(auctions[nftAddress][tokenId].auctionStatus);
        if (auctionState == 0) {
            _auctionStatus = "Unassigned";
        } else if (auctionState == 1) {
            _auctionStatus = "Initiated";
        } else if (auctionState == 2) {
            _auctionStatus = "Bidded";
        } else if (auctionState == 3) {
            _auctionStatus = "Revealed";
        } else if (auctionState == 4) {
            _auctionStatus = "Executed";
        } else if (auctionState == 5) {
            _auctionStatus = "Unexecuted";
        }
    }

    // mapping(uint256 => mapping(address => Bid)) public bids;

    function getBidders(address nftAddress, uint256 tokenId)
        public
        view
        returns (address[] memory)
    {
        address[] memory biddersArray = auctions[nftAddress][tokenId].bidders;
        require(biddersArray.length != 0, "no bids");
        return biddersArray;
    }

    function getBid(
        address nftAddress,
        uint256 tokenId,
        address bidder
    ) public view returns (Bid memory) {
        Auction storage auction = auctions[nftAddress][tokenId];
        require(auction.bidders.length != 0, "no bids");
        return auction.bids[bidder];
    }
}
