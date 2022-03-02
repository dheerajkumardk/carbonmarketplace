// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IMintingFactory {
    function updateOwner(
        address _nftContract,
        uint256 _tokenId,
        address _newOwner
    ) external;
}
