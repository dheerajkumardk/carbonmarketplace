// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

import "./../Interface/IAdminRegistry.sol";

contract ERC721NFTContract is ERC721URIStorageUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIds;
    
    // address of admin registry
    address public adminRegistry;
    // address of minting factory
    address public factory;
    // starting token id
    uint256 public startTokenId;

    string baseURI = "https://carbon.xyz";

    // @dev only minting factory can call this
    modifier onlyFactory() {
        require(
            msg.sender == factory,
            "ERC721NFTContract: Only factory can mint NFT"
        );
        _;
    }

    // @dev only admin registry can call this
    modifier onlyAdminRegistry() {
        require(
            IAdminRegistry(adminRegistry).isAdmin(msg.sender),
            "ERC721NFTContract: Only admin can call this"
        );
        _;
    }

    /*
     * @param _name - name of the NFT to be minted
     * @param _symbol - symbol of the NFT
     * @param _adminRegistry - address of the admin registry
     * @param _tokenId - starting token id for the contract
     */

    function initialize(string memory _name, string memory _symbol, address _adminRegistry, uint256 _tokenId) external initializer {
        __ERC721_init(_name, _symbol);
        adminRegistry = _adminRegistry;
        factory = msg.sender;
        _tokenIds._value = _tokenId;
        startTokenId = _tokenId + 1;
    }

    /*
     * @notice mints new token for the NFT contract
     * @returns the token id of the token minted
     */
    function mint() public onlyFactory returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        string memory tokenURI = string(
            abi.encodePacked(baseURI, StringsUpgradeable.toString(newItemId))
        );

        _mint(adminRegistry, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    /*
     * @dev returns the current token id for this contract
     */
    function getTotalNFTs() public view returns (uint256) {
        return _tokenIds.current() - startTokenId + 1;
    }

    /*
     * @dev updates the address of the minting factory
     * @param address of minting factory
     */
    function updateFactory(address _factory) external onlyAdminRegistry {
        factory = _factory;
    }
}
