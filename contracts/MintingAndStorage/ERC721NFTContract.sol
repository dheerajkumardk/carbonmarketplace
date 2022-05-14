// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

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
        require(
            msg.sender == factory,
            "ERC721NFTContract: Only factory can mint NFT"
        );
        _;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "ERC721NFTContract: Only admin can call this"
        );
        _;
    }

    /*
     * @param _name - name of the NFT to be minted
     * @param _symbol - symbol of the NFT
     * @param _admin - address of the contract admin
     * @param _tokenId - starting token id for the contract
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _admin,
        uint256 _tokenId
    ) ERC721(_name, _symbol) {
        admin = _admin;
        factory = msg.sender;
        _tokenIds._value = _tokenId;
    }

    /*
     * @notice mints new token for the NFT contract
     * @returns the token id of the token minted
     */
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

    /*
     * @dev returns the current token id for this contract
     */
    function getTotalNFTs() public view returns (uint256) {
        return _tokenIds.current();
    }

    /*
     * @dev changes the admin for this contract
     */
    function changeAdmin(address _newAdmin) public onlyAdmin {
        require(
            _newAdmin != address(0),
            "ERC721NFTContract: Zero address cannot be set"
        );
        admin = _newAdmin;
    }

    /*
     * @dev updates the address of the minting factory
     */
    function updateFactory(address _factory) external onlyAdmin {
        factory = _factory;
    }
}
