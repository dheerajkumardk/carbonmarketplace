// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ICollection {

    function adminRegistry() external view returns (address);
    
    function factory() external view returns (address);

    function startTokenId() external view returns (uint256);

    function baseURI() external view returns (string memory);

    function getTotalNFTs() external view returns (uint256);

    function initialize(
        string memory _name,
        string memory _symbol,
        address _adminRegistry,
        uint256 _tokenId
    ) external;

    function mint(address _owner) external returns (uint256);

    function mint(address _owner, string memory _tokenURI) external returns (uint256);

    function setBaseURI(string memory _baseURI) external;

    function updateFactory(address _factory) external;

}