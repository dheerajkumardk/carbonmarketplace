// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ERC721NFTContract is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address public admin;
    address public factory;

    string baseURI = "https://carbon.xyz";

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can mint NFT");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _admin
    ) ERC721(_name, _symbol) {
        admin = _admin;
        factory = msg.sender;
    }

    function mint() public onlyFactory returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        string memory tokenURI = string(
            abi.encodePacked(baseURI, Strings.toString(newItemId))
        );

        _mint(admin, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function getTotalNFTs() public view returns (uint256) {
        return _tokenIds.current();
    }

    function changeAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Zero address cannot be set");
        admin = _newAdmin;
    }

    function updateFactory(address _factory) external onlyAdmin {
        factory = _factory;
    }
}
