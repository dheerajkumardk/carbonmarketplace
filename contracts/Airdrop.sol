// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Interface/IERC20.sol";

contract Airdrop is Ownable {
    using SafeMath for uint256;

    address public elementAddress;

    constructor(address _elementAddress) public {
        elementAddress = _elementAddress;
    }

    
   
}