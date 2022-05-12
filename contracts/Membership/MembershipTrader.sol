// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./CarbonMembership.sol";

contract MembershipTrader is Ownable {
    using Address for address;

    event CarbonFeeVaultSet(address indexed carbonFeeVault);

    uint256 public constant tokensToDeposit = 100000;

    address gemsToken;
    address carbonMembershipNFT;
    address carbonFeeVault;

    constructor(address _gemsToken, address _carbonMembershipNFT) {
        gemsToken = _gemsToken;
        carbonMembershipNFT = _carbonMembershipNFT;
    }

    /*
     * @notice Executes the order, once token allowance is valid,
     * transfers the tokens from the user to the carbon Fee Vault and
     * mints a Membership Pass (NFT) for the user
     */
    function executeOrder(address user) external {
        // validate
        bool valid = _validate(msg.sender);
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
    function setCarbonFeeVault(address _carbonfeevault) external onlyOwner {
        carbonFeeVault = _carbonfeevault;

        emit CarbonFeeVaultSet(_carbonfeevault);
    }

    /*
     * @dev Updates the owner of the membership trader contract
     */
    function updateOwner(address _newOwner) external onlyOwner {
        _transferOwnership(_newOwner);
    }

    /**
     * @dev Validates the token allowance of the user to the membership trader contract
     * @return true if token allowance is valid and sender is not the contract
     */
    function _validate(address user) internal view returns (bool) {
        uint256 allowanceAmt = IERC20(gemsToken).allowance(user, address(this));
        require(
            allowanceAmt >= tokensToDeposit,
            "Tokens are not approved to the Membership Trader"
        );

        // validate for contract
        require(!Address.isContract(msg.sender), "Sender is a contract");

        return true;
    }
}
