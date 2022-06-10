// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IMembershipTrader {

    function gemsToken() external view returns (address);

    function carbonMembershipNFT() external view returns (address);

    function carbonFeeVault() external view returns (address);

    function executeOrder(address user) external;
    
    function setCarbonFeeVault(address _carbonfeevault) external;
    
    function updateOwner(address _newOwner) external;
 
}
