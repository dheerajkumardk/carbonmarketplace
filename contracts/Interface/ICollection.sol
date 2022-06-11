// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ICollection {

    function adminRegistry() external view returns (address);
    
    function factory() external view returns (address);

    function startTokenId() external view returns (uint256);

    function baseURI() external view returns (string memory);

    function getTotalNFTs() external view returns (uint256);

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 indexed _tokenId
    );


    event Approval(
        address indexed _owner,
        address indexed _approved,
        uint256 indexed _tokenId
    );

    function initialize(
        string memory _name,
        string memory _symbol,
        address _adminRegistry,
        uint256 _tokenId
    ) external;

    event ApprovalForAll(
        address indexed _owner,
        address indexed _operator,
        bool _approved
    );

    function balanceOf(address _owner) external view returns (uint256);

    function ownerOf(uint256 _tokenId) external view returns (address);

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes calldata data
    ) external payable;


    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external payable;

    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external payable;

    function approve(address _approved, uint256 _tokenId) external payable;

    function setApprovalForAll(address _operator, bool _approved) external;

    function getApproved(uint256 _tokenId) external view returns (address);

    function isApprovedForAll(address _owner, address _operator)
        external
        view
        returns (bool);

    function mint(address _owner) external returns (uint256);

    function mint(address _owner, string memory _tokenURI) external returns (uint256);

    function setBaseURI(string memory _baseURI) external;

    function updateFactory(address _factory) external;

}