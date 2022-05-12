// SPDX-License-Identifier: MIT

// ERC-20 token named GEMS
pragma solidity ^0.8.0;

import "./../ETHToken.sol";

contract GEMSToken is ERC20 {
    constructor() ERC20("GEMS Token", "GEMS") {
        _mint(msg.sender, 1000000000 * 10**18); // Mints 100M GEMs
    }
}
