// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IExchangeCore {
    function MAX_BASE_FACTOR() external view returns (uint256);

    function WETH() external view returns (address);

    function mintingFactory() external view returns (address);

    function carbonMembership() external view returns (address);

    function buyerPremiumFees() external view returns (uint256);
    
    function adminRegistry() external view returns (address);
    
    function charity() external view returns (address);

    function getRoleMembers()
        external
        view
        returns (uint256, address[] memory);

    function cancelledOrders(
        address _buyer,
        address _nftContract,
        uint256 _tokenId
    ) external view returns (bool);



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

    function setBuyerPremiumFees(uint256 _buyersFee) external;

    function updateCharity(address _newCharity) external;

    function pause() external;

    function unpause() external;

    function addAdmin(address _account) external;
    
    function removeAdmin(address _account) external;
    
    function leaveRole() external;
}
