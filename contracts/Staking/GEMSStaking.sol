// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./../Interface/IERC20.sol";
import "./GEMSNFT.sol";

contract GEMSStaking {
    address public GEMSToken;
    address public GEMSNFTAddress;
    uint256 minTokensToStake = 100000 * 10**18;

    constructor(address _gemsToken, address _gemsNFTAddress) {
        GEMSToken = _gemsToken;
        GEMSNFTAddress = _gemsNFTAddress;
    }

    struct UserInfo {
        uint256 tokensStaked;
        uint256 tokenId;
    }

    mapping(address => UserInfo) public userData;

    event Staked(address user, uint256 amount);
    event UnStaked(address user, uint256 amount);

    function stake(address user, uint256 _amount) public {
        require(
            _amount >= minTokensToStake,
            "Requires minimum 100,000 tokens for staking"
        );
        require(user != address(0), "User address is zero");

        IERC20(GEMSToken).transferFrom(user, address(this), _amount);
        // nft token generated
        // string memory tokenURI = "hello";
        uint256 tokenId = GEMSNFT(GEMSNFTAddress).mintNewNFT(user);

        userData[user] = UserInfo(_amount, tokenId);

        emit Staked(user, _amount);
    }

    function unstake() public {
        uint256 amount = userData[msg.sender].tokensStaked;
        uint256 tokenId = userData[msg.sender].tokenId;
        require(amount != 0, "User had no amount staked!");
        require(msg.sender == GEMSNFT(GEMSNFTAddress).ownerOf(tokenId));

        IERC20(GEMSToken).transfer(msg.sender, amount);
        GEMSNFT(GEMSNFTAddress).burnNFT(tokenId);
        emit UnStaked(msg.sender, amount);
    }
    // mapping => user -> Struct (stakedAmt, tokenId)
    // stake fn => submits GEMS, mints NFT
    // unstake fn => submit nft id => get back his GEMS, NFT burn
}