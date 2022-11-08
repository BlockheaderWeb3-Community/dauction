// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTContract is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _nftIds;

    uint256 public constant MAX_SUPPLY = 1000;

    uint256 public totalMinted;

    string[3] public tokenUriArray = [
        "https://ipfs.io/ipfs/QmeGfTLw5i8Mz9Gi4ZrN8DPPLSr18MN42uZLbciroxhnSa"
    ];

    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
    {}

    function mintNFT() external {
        uint256 newTokenId = _nftIds.current();
        require(newTokenId <= MAX_SUPPLY, "limit exceeded");
        _safeMint(msg.sender, newTokenId);
        _nftIds.increment();
        setTokenURI();
        totalMinted += 1;
    }

    function getTotalMinted() public view returns (uint256) {
        return totalMinted;
    }

    function setTokenURI() public {
        _setTokenURI(
            totalMinted,
            "https://ipfs.io/ipfs/QmRn4Aaj4LMuunoJL3XNz92N1DwVdiesrvMJGymj26TnMF"
        ); // totalMinted += 1; // 1
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURI(tokenId);
    }
}
