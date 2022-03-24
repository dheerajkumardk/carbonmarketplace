// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AdminRole is AccessControl {
    // bytes32 public constant override DEFAULT_ADMIN_ROLE = keccak256("DEFAULT_ADMIN_ROLE");

    constructor(address account) {
        _setupRole(DEFAULT_ADMIN_ROLE, account);
    }

    modifier onlyAdmin() {
        require(isAdmin(msg.sender), "Restricted to admin.");
        _;
    }

    function isAdmin(address account) internal view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    function addAdmin(address account) internal onlyAdmin {
        grantRole(DEFAULT_ADMIN_ROLE, account);
    }

    /// @dev Remove oneself as a member of the community.
    function leaveRole() internal {
        renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function removeAdmin(address account) internal onlyAdmin {
        revokeRole(DEFAULT_ADMIN_ROLE, account);
    }
}
