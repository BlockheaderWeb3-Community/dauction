// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IDauctionEvents {
    /* ========== EVENTS ========== */
    /// @notice emitted when auction is created by auctioneer
    /// @param nft address of the NFT contract
    /// @param tokenId unique ID of the NFT asset
    /// @param seller address of the auctioneer
    /// @param minBidPrice minimum threshold amount for the auctioned NFT
    /// @param startTime time of commencement of bid
    /// @param endTime expected time an auction should end
    /// @param revealDuration valid period within which all bidders must reveal their bid
    /// @param auctionCreatedAt timestamp of the creation time
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

    /// @notice emitted when a bid is created by bidder
    /// @param nftContractAddress address of the auctioned NFT
    /// @param tokenId unique ID of the auctioned NFT asset
    /// @param bidCommitment unique hash of a given bid
    /// @param biddedAt timestamp of the bid creation time
    event BidCreated(
        address nftContractAddress,
        uint256 tokenId,
        bytes32 bidCommitment,
        uint256 biddedAt
    );

    /// @notice emitted when bid is revealed by bidder
    /// @param tokenContract address of the auctioned NFT
    /// @param tokenId unique ID of the auctioned NFT asset
    /// @param bidHash bytes32 hash of a given bid
    /// @param salt unique hash added to conseal bid commitment
    /// @param bidValue amount of bid tokens
    event BidRevealed(
        address tokenContract,
        uint256 tokenId,
        bytes32 bidHash,
        address bidder,
        bytes32 salt,
        uint256 bidValue
    );

    /// @notice emitted when no bid exists for an auctioned NFT asset
    /// @param nftAddress address of the auctioned NFT
    /// @param tokenId  unique ID of the auctioned NFT asset
    /// @param owner address of the auctioneer
    /// @param time timestamp of the unsettled auction

    event AuctionUnsettled(
        address nftAddress,
        uint256 tokenId,
        address owner,
        uint256 time
    );

    /// @notice emitted when an auction has been successfully settled
    /// @param nftAddress address of the auctioned NFT
    /// @param tokenId  unique ID of the auctioned NFT asset
    /// @param previousOwner address of the auctioneer
    /// @param newOwner address of the highest bidder
    /// @param tokenAmountPaid amount of token paid to auctioneer
    /// @param auctionSettleTime time of settlement of auction

    event AuctionSettled(
        address nftAddress,
        uint256 tokenId,
        address previousOwner,
        address newOwner,
        uint256 tokenAmountPaid,
        uint256 auctionSettleTime
    );
}
