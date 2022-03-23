// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AdminRole is AccessControl {
    bytes32 public constant DEFAULT_ADMIN = keccak256("DEFAULT_ADMIN");

    constructor(address _admin) {
        _setupRole(DEFAULT_ADMIN, _admin);
    }

    modifier onlyAdmin() {
        require(isAdmin(msg.sender), "Restricted to admin.");
        _;
    }

    function isAdmin(address account) internal view returns (bool) {
        return hasRole(DEFAULT_ADMIN, account);
    }

    function addAdmin(address account) external onlyAdmin {
        grantRole(DEFAULT_ADMIN, account);
    }

    /// @dev Remove oneself as a member of the community.
    function leaveRole() external {
        renounceRole(DEFAULT_ADMIN, msg.sender);
    }

    function removeAdmin(address account) external onlyAdmin {
        revokeRole(DEFAULT_ADMIN, account);
    }
}
