// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract GEMSNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string baseURI = "https://carbon.xyz";

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {}

    function mintNewNFT(address user) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        string memory tokenURI = string(
            abi.encodePacked(baseURI, Strings.toString(newItemId))
        );
        _mint(user, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function getTotalNFTs() public view returns (uint256) {
        return _tokenIds.current();
    }

    function burnNFT(uint256 tokenId) public {
        _burn(tokenId);
    }
}
