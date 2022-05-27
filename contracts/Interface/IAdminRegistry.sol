// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IAdminRegistry {
    function getRoleMember(bytes32 role, uint256 index) external view returns (address);

    function getRoleMemberCount(bytes32 role) external view returns (uint256);

    function getRoleMembers()
        external
        view
        returns (uint256, address[] memory);

    function isAdmin(address user) external view returns(bool);

    function leaveRole() external;

    function addAdmin(address account) external;

    function removeAdmin(address account) external;

}
