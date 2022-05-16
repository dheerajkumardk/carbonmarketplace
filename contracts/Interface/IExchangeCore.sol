// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IExchangeCore {
    function MAX_BASE_FACTOR() external view returns (uint256);

    function ETH() external view returns (address);

    function mintingFactory() external view returns (address);

    function carbonMembership() external view returns (address);

    function carbonFeeVault() external view returns (address);

    function buyerPremiumFees() external view returns (uint256);

    function cancelledOrders(
        address _buyer,
        address _nftContract,
        uint256 _tokenId
    ) external view returns (bool);

    function getRoleMembers()
        external
        view
        returns (uint256, address[] memory);

    function executeOrder(
        address _nftContract,
        uint256 _tokenId,
        address _buyer,
        address _seller,
        uint256 _amount,
        uint256 _auctionEndTime,
        uint256 _mode
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

    function updateFactory(address _factory) external;

    function setCarbonFeeVaultAddress(address _carbonFeeVault) external;

    function setBuyerPremiumFees(uint256 _buyersFee) external;

    function pause() external;

    function unpause() external;
}
