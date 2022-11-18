// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract NFTContract is ERC721 {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _nftIds;

    uint256 public constant MAX_SUPPLY = 1000;

    uint256 public totalMinted;

    string public uri;
 
    constructor(string memory name_, string memory symbol_, string memory _uri)
        ERC721(name_, symbol_)
    {
        uri = _uri;
    }

    function mintNFT() external {
        uint256 newTokenId = _nftIds.current();
        require(newTokenId <= MAX_SUPPLY, "limit exceeded");
        _safeMint(msg.sender, newTokenId);
        _nftIds.increment();
        totalMinted += 1;
    }

    function getTotalMinted() public view returns (uint256) {
        return totalMinted;
    }

    function _baseURI() internal override view returns (string memory) {
        return uri;
    }

    function setBaseUri(string memory _uri) public {
        uri = _uri;
    }

     function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : "";
    }

    // function setTokenURI() public {
    //     _setTokenURI(
    //         totalMinted,
    //     "ipfs://QmeYhWhdX1ALiF5AeaHM5VwAR6XEUqL58kmdEx8GxxPkXk"
    //     ); 
    // }

  
}