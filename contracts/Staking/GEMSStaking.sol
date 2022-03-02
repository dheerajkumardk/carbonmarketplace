// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./../Interface/IERC20.sol";
import "./GEMSNFT.sol";

contract GEMSStaking {
    address public GEMSToken;
    GEMSNFT internal IGEMSNFT;

    constructor(address _gemsToken, GEMSNFT _IGEMSNFT) {
        GEMSToken = _gemsToken;
        IGEMSNFT = GEMSNFT(_IGEMSNFT);
    }

    struct UserInfo {
        uint256 tokensStaked;
        uint256 tokenId;
    }

    mapping(address => UserInfo) public userData;

    event Staked(address user, uint256 amount);
    event UnStaked(address user, uint256 amount);

    function stake(uint256 _amount) public {
        require(_amount >= 100000, "Requires minimum 100,000 tokens for staking");
        
        IERC20(GEMSToken).transferFrom(msg.sender, address(this), _amount);
        // nft token generated
        string memory tokenURI = "hello";
        IGEMSNFT.mintNewNFT(tokenURI);
        uint256 tokenId = IGEMSNFT.getTotalNFTs();

        userData[msg.sender] = UserInfo(_amount, tokenId);

        emit Staked(msg.sender, _amount);
    }

    function unstake() public {
        uint256 amount = userData[msg.sender].tokensStaked;
        uint256 tokenId = userData[msg.sender].tokenId;

        IERC20(GEMSToken).transferFrom(address(this), msg.sender, amount);
        IGEMSNFT.burnNFT(tokenId);
        emit UnStaked(msg.sender, amount);
    }
    // mapping => user -> Struct (stakedAmt, tokenId)
    // stake fn => submits GEMS, mints NFT
    // unstake fn => submit nft id => get back his GEMS, NFT burn
}
