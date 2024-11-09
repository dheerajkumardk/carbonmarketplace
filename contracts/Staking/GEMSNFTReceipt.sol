// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract GEMSNFTReceipt is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string baseURI = "https://carbon.xyz";
    address public stakingPool;
    address public admin;

    modifier onlyAuthorised() {
        require(
            msg.sender == stakingPool || msg.sender == admin,
            "GEMSNFTReceipt: Only Staking pool contract or admin can call this function"
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _admin
    ) ERC721(_name, _symbol) {
        admin = _admin;
    }

    /*
     * @dev Mints a NFT Receipt for the user
     */
    function mintNewNFT(address user) public onlyAuthorised returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        string memory tokenURI = string(
            abi.encodePacked(baseURI, Strings.toString(newItemId))
        );
        _mint(user, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    /*
     * @returns total number of NFT receipts minted
     */
    function getTotalNFTs() public view returns (uint256) {
        return _tokenIds.current();
    }

    /*
     * @dev burn the token with given token Id
     */
    function burnNFT(uint256 tokenId) public {
        _burn(tokenId);
    }

    /*
     * @dev sets the address of the staking pool
     */
    function setStakingPool(address _stakingPool) public onlyAuthorised {
        stakingPool = _stakingPool;
    }
}
