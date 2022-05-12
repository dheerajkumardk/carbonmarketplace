// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./../Interface/IERC20.sol";
import "./CarbonMembership.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MembershipTrader is Ownable {
    using Address for address;

    event CarbonFeeVaultSet(address indexed carbonFeeVault);

    address gemsToken;
    address carbonMembershipNFT;
    address carbonFeeVault;
    uint256 public constant tokensToDeposit = 100000;

    constructor(address _gemsToken, address _carbonMembershipNFT) {
        gemsToken = _gemsToken;
        carbonMembershipNFT = _carbonMembershipNFT;
    }

    /*
     * @dev Validates the token allowance of the user to the membership trader contract
     * @returns true if token allowance is valid and sender is not the contract
     */
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

    /*
     * @notice Executes the order, once token allowance is valid,
     * transfers the tokens from the user to the carbon Fee Vault and
     * mints a Membership Pass (NFT) for the user
     */
    function executeOrder(address user) public {
        // validate
        bool valid = validate(msg.sender);
        require(valid, "Order conditions not met");
        // transfer token
        IERC20(gemsToken).transferFrom(user, carbonFeeVault, tokensToDeposit);
        // mint nft
        CarbonMembership(carbonMembershipNFT).mintNewNFT(user);
        // emit event
    }

    /*
     * @dev Sets the carbon fee vault address
     */
    function setCarbonFeeVault(address _carbonfeevault) public onlyOwner {
        carbonFeeVault = _carbonfeevault;

        emit CarbonFeeVaultSet(_carbonfeevault);
    }

    /*
     * @dev Updates the owner of the membership trader contract
     */
    function updateOwner(address _newOwner) public onlyOwner {
        _transferOwnership(_newOwner);
    }
}
