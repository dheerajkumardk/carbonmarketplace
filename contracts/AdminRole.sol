// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract AdminRole is AccessControlEnumerable {
    // bytes32 public constant override DEFAULT_ADMIN_ROLE = keccak256("DEFAULT_ADMIN_ROLE");

    constructor(address account) {
        _setupRole(DEFAULT_ADMIN_ROLE, account);
    }

    modifier onlyAdmin() {
        require(isAdmin(msg.sender), "Restricted to admin.");
        _;
    }

    /*
     * @dev Checks if the given address is the admin
     */
    function isAdmin(address account) internal view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    /*
     * @dev Adds the admin role for the given address
     */
    function addAdmin(address account) external onlyAdmin {
        grantRole(DEFAULT_ADMIN_ROLE, account);
    }

    /*
     * @dev Removes oneself as the admin member of th community
     */
    function leaveRole() external {
        renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /*
     * @dev Removes the given address from the admin role
     */
    function removeAdmin(address account) external onlyAdmin {
        revokeRole(DEFAULT_ADMIN_ROLE, account);
    }
}
