// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IGEMSStaking {
    function stake(address user, uint256 _amount) external;

    function unstake() external;
}