// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./GEMSNFTReceipt.sol";

contract GEMSStaking {
    struct UserInfo {
        uint256 tokensStaked;
        uint256 tokenId;
        uint256 timestamp;
    }

    event Staked(address user, uint256 amount);
    event UnStaked(address user, uint256 amount);

    address public immutable GEMSToken;
    address public GEMSNFTAddress;
    uint256 tokensToStake = 100000 * 10**18;

    mapping(address => UserInfo) public userData;

    constructor(address _gemsToken, address _gemsNFTAddress) {
        GEMSToken = _gemsToken;
        GEMSNFTAddress = _gemsNFTAddress;
    }

    /**
     * @dev User stakes their funds into the contract and get the Receipt as NFT for this
     * @param user - address of the user
     * @param _amount - amount of tokens to stake
     * transfers the tokens from the user to the contract
     * mints the NFT Receipt for the user
     * Emits an event {Staked} indicating user and amount staked
     */
    function stake(address user, uint256 _amount) public {
        uint256 amountStaked = userData[user].tokensStaked;
        require(
            amountStaked == 0,
            "GEMSStaking: User had already staked tokens"
        );
        require(
            _amount == tokensToStake,
            "GEMSStaking: Requires exactly 100,000 tokens for staking"
        );
        require(user != address(0), "GEMSStaking: User address is zero");
        // on-chain approval
        uint256 allowanceAmt = IERC20(GEMSToken).allowance(user, address(this));
        require(
            allowanceAmt == _amount,
            "GEMSStaking: Inadequate token allowance"
        );

        IERC20(GEMSToken).transferFrom(user, address(this), _amount);
        // nft token generated
        // string memory tokenURI = "hello";
        uint256 tokenId = GEMSNFTReceipt(GEMSNFTAddress).mintNewNFT(user);

        userData[user] = UserInfo(_amount, tokenId, block.timestamp);

        emit Staked(user, _amount);
    }

    /**
     * @dev To unstake the previously staked funds
     * transfers the staked tokens back to the user
     * burns the NFT Receipt
     * Emits an event {UnStaked} indicating user and the amount unstaked
     */
    function unstake() public {
        uint256 amount = userData[msg.sender].tokensStaked;
        uint256 tokenId = userData[msg.sender].tokenId;
        require(amount != 0, "GEMSStaking: User had no amount staked!");
        require(
            msg.sender == GEMSNFTReceipt(GEMSNFTAddress).ownerOf(tokenId),
            "GEMSStaking: Caller is not the owner"
        );

        userData[msg.sender].tokensStaked = 0;
        GEMSNFTReceipt(GEMSNFTAddress).burnNFT(tokenId);

        IERC20(GEMSToken).transfer(msg.sender, amount);
        emit UnStaked(msg.sender, amount);
    }
}
