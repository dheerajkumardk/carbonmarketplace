// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ICarbonMembership is IERC721 {

    function baseURI() external view returns (string memory);
    
    function membershipTrader() external view returns (address);

    function mintNewNFT(address user)
        external
        returns (uint256);

    function setMembershipTrader(address _newMembershipTrader) external;

    function pause() external;

    function unpause() external;

    function updateOwner(address _newOwner) external;
}
