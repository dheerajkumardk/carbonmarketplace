// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ERC721NFTContract is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address public factory;
    string baseURI = "https://carbon.xyz";

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory contract can mint NFTs");
        _;
    }

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        factory = msg.sender;
    }

    function mintNewNFT() public onlyFactory returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        string memory tokenURI = string(
            abi.encodePacked(baseURI, Strings.toString(newItemId))
        );

        _mint(factory, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function getTotalNFTs() public view returns (uint256) {
        return _tokenIds.current();
    }
}
