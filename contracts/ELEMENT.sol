// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ETHToken.sol";

contract GEMSToken is ERC20 {
    constructor() ERC20("CARBON elements", "element") {
        _mint(msg.sender, 1000000000 * 10**18); // Mints 1B CARBON elements
    }
}
