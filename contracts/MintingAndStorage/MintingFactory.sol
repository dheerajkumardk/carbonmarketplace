// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./ERC721NFTContract.sol";
import "../Interface/IERC20.sol";
import "./../AdminRole.sol";

contract MintingFactory is AdminRole {
    // this contract creates an NFT contract
    // and then it can mint NFT for that contract
    // keeps track of all NFT contracts for the users

    address public exchangeAddress;
    address public ETH;
    address public carbonMintingFactoryFeeVault;

    constructor(address _eth, address root) AdminRole(root) {
        ETH = _eth;
    }

    mapping(address => address[]) public ownerToNFTs;
    // nft contract => (token id => owner)
    mapping(address => mapping(uint256 => address)) public nftToIdToOwner;
    // nftContract => ownerAddress
    mapping(address => address) public nftToOwner;

    event NFTContractCreated(
        string name,
        string symbol,
        address nftContract,
        address creator
    );
    event NFTMinted(address nftContract, uint256 tokenId);
    event OwnerUpdated(address nftContract, uint256 tokenId, address newOwner);
    event ExchangeAddressChanged(address oldExchange, address newExchange);

    modifier onlyCreatorAdmin(address _nftContract) {
        require(
            nftToOwner[_nftContract] == msg.sender || isAdmin(msg.sender),
            "Only Creator or Admin can call this!"
        );
        _;
    }

    modifier onlyExchange() {
        require(msg.sender == exchangeAddress, "Only Exchange can call this!");
        _;
    }

    function createNFTContract(
        string memory _name,
        string memory _symbol,
        address _creator
    ) external onlyAdmin returns (address _nftcontract) {
        // create new contract
        address nftContract = address(
            new ERC721NFTContract(_name, _symbol, msg.sender)
        );
        // update mapping of owner to NFTContracts
        ownerToNFTs[_creator].push(nftContract);
        nftToOwner[nftContract] = _creator;
        ERC721NFTContract(nftContract).setApprovalForAll(exchangeAddress, true);

        emit NFTContractCreated(_name, _symbol, nftContract, _creator);
        // return address of new contract
        return nftContract;
    }

    function mintNFT(address _nftContract)
        public
        onlyCreatorAdmin(_nftContract)
    {
        uint256 _tokenId = ERC721NFTContract(_nftContract).mint();

        emit NFTMinted(_nftContract, _tokenId);
    }

    // updating owner in our factory records => book-keeping
    function updateOwner(
        address _nftContract,
        uint256 _tokenId,
        address _newOwner
    ) public onlyExchange {
        nftToIdToOwner[_nftContract][_tokenId] = _newOwner;

        emit OwnerUpdated(_nftContract, _tokenId, _newOwner);
    }

    function updateExchangeAddress(address _newExchange) public onlyAdmin {
        address oldExchange = exchangeAddress;
        exchangeAddress = _newExchange;
        emit ExchangeAddressChanged(oldExchange, exchangeAddress);
    }

    // lists all NFT collections for a owner
    function getNFTsForOwner(address user)
        public
        view
        returns (address[] memory)
    {
        return ownerToNFTs[user];
    }

    // get total NFTs minted for a contract
    function getTotalNFTsMinted(address _nftContract)
        public
        view
        returns (uint256)
    {
        return ERC721NFTContract(_nftContract).getTotalNFTs();
    }

    function transferFunds() external onlyAdmin {
        uint256 totalBalance = IERC20(ETH).balanceOf(address(this));
        IERC20(ETH).transfer(carbonMintingFactoryFeeVault, totalBalance);
    }

    function setCarbonMintingFactoryFeeVault(address _mintingFactoryVault)
        external
        onlyAdmin
    {
        require(
            _mintingFactoryVault != address(0),
            "Vault address cannot be zero"
        );
        carbonMintingFactoryFeeVault = _mintingFactoryVault;
    }
}
