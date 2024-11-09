// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract CarbonMembership is ERC721URIStorage, Ownable, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    event MembershipTraderSet(address indexed _membershipTrader);

    string public baseURI = "https://carbon.xyz";
    // Address of member ship trader contract
    address public membershipTrader;

    /**
     * @notice Used to check the caller is membership trader
     */
    modifier onlyMembershipTrader() {
        require(
            msg.sender == membershipTrader,
            "CarbonMembership: Only Membership Trader can call this function"
        );
        _;
    }

    constructor() ERC721("Carbon Membership Pass", "CMEM") {}

    /*
     * @dev Mints new NFT for the user
     * @param user - user address for whom the nft is to be minted
     * @returns the token id of the nft minted
     */
    function mintNewNFT(address user)
        external
        onlyMembershipTrader
        whenNotPaused
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        string memory tokenURI = string(
            abi.encodePacked(baseURI, Strings.toString(newItemId))
        );
        _mint(user, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    /**
     * @notice Sets the address of the Membership Trader contract
     *
     * @param _newMembershipTrader Address of the MembershipTrader contract
     */
    function setMembershipTrader(address _newMembershipTrader)
        external
        onlyOwner
    {
        membershipTrader = _newMembershipTrader;
        emit MembershipTraderSet(_newMembershipTrader);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /*
     * @dev transfers the ownership of the contract to the new owner
     */
    function updateOwner(address _newOwner) external onlyOwner {
        _transferOwnership(_newOwner);
    }
}
