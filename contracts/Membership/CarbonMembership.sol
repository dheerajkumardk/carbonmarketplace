// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract CarbonMembership is ERC721URIStorage, Ownable, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string baseURI = "https://carbon.xyz";
    address public membershipTrader;

    constructor() ERC721("Carbon Membership Pass", "CMEM") {}

    modifier onlyMembershipTrader() {
        require(
            msg.sender == membershipTrader,
            "Only Membership Trader can call this function"
        );
        _;
    }

    function mintNewNFT(address user)
        public
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

    function setMembershipTrader(address _newMembershipTrader)
        public
        onlyOwner
    {
        membershipTrader = _newMembershipTrader;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function updateOwner(address _newOwner) public onlyOwner {
        _transferOwnership(_newOwner);
    }
}

// erc 721
// only thing, not called by contract
// mint function pausable
// no burn

// mint => called by membership trader only
