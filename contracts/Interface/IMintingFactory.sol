// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IMintingFactory {
    function updateOwner(
        address _nftContract,
        uint256 _tokenId,
        address _newOwner
    ) external;

    function createNFTContract(
        string memory _name,
        string memory _symbol,
        address _creator,
        address _contractAdmin
    ) external returns (address _nftcontract);

    function mintNFT(address _nftContract) external;

    function updateExchangeAddress(address _newExchange) external;

    function getNFTsForOwner(address user)
        external
        view
        returns (address[] memory);

    function getTotalNFTsMinted(address _nftContract)
        external
        view
        returns (uint256);
}
