// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ICarbonMembership {
    function balanceOf(address _owner) external view returns (uint256);
}
