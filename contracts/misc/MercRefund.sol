// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MercRefund {

    receive() external payable {}

    function refund(address[] memory refundList) public payable {
        for(uint i = 0; i < refundList.length; i++){
            address buyer = refundList[i];
            (bool sent, ) = buyer.call{value: 0.1 ether}("");
            require(sent, "Failed to send Ether");
        }
    }
}