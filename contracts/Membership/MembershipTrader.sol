// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./../Interface/IERC20.sol";
import "./CarbonMembership.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MembershipTrader is Ownable {
    using Address for address;

    address gemsToken;
    address carbonMembershipNFT;
    uint256 public constant tokensToDeposit = 100000;

    constructor(address _gemsToken, address _carbonMembershipNFT) {
        gemsToken = _gemsToken;
        carbonMembershipNFT = _carbonMembershipNFT;
    }

    function validate(address user) internal view returns (bool) {
        uint256 allowanceAmt = IERC20(gemsToken).allowance(user, address(this));
        require(
            allowanceAmt >= tokensToDeposit,
            "Tokens are not approved to the Membership Trader"
        );

        // validate for contract
        require(!Address.isContract(msg.sender), "Sender is a contract");

        return true;
    }

    function executeOrder(address user) public {
        // validate
        bool valid = validate(msg.sender);
        require(valid, "Order conditions not met");
        // transfer token
        IERC20(gemsToken).transferFrom(user, address(this), tokensToDeposit);
        // mint nft
        CarbonMembership(carbonMembershipNFT).mintNewNFT(user);
        // emit event
    }

    function withdrawGEMS() public onlyOwner {
        uint256 _amount = IERC20(gemsToken).balanceOf(address(this));
        IERC20(gemsToken).transfer(msg.sender, _amount);
    }
}
