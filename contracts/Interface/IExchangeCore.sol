// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IExchangeCore {
    function executeOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer,
        address _seller,
        uint256 _amount,
        uint256 _auctionEndTime
    ) external;

    function cancelOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer
    ) external;
 
    function uncancelOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer
    ) external;
}
