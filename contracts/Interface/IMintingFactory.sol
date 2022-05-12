// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IMintingFactory {
    function ETH() external view returns (address);

    function exchangeAddress() external view returns (address);

    function carbonMintingFactoryFeeVault() external view returns (address);

    function ownerToNFTs(address _owner)
        external
        view
        returns (address[] memory);

    function nftToIdToOwner(address _owner, uint256 _tokenId)
        external
        view
        returns (address);

    function nftToOwner(address _nft) external view returns (address);

    function getNFTsForOwner(address user)
        external
        view
        returns (address[] memory);

    function getTotalNFTsMinted(address _nftContract)
        external
        view
        returns (uint256);

    function getRoleMembers()
        external
        view
        returns (uint256 roleMemberCount, address[] memory roleMembers);

    function mintNFT(address _nftContract) external;

    function updateExchangeAddress(address _newExchange) external;

    function setCarbonMintingFactoryFeeVault(address _mintingFactoryVault)
        external;

    function createCollection(
        string memory _name,
        string memory _symbol,
        address _creator,
        uint256 _tokenId
    ) external returns (address _nftcontract);

    function updateOwner(
        address _nftContract,
        uint256 _tokenId,
        address _newOwner
    ) external;
}
