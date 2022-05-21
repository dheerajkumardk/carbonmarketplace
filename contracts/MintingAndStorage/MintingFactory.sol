// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./ERC721NFTContract.sol";
import "../Interface/IAdminRegistry.sol";
import "../Interface/IERC721NFTContract.sol";
import "../Library/Clones.sol";

/**
 * @title Minting Factory Contract
 *
 * @dev This contract is used to mint NFT and keep track of all the NFT by users
 */
contract MintingFactory {
    event CollectionCreated(
        string name,
        string symbol,
        address nftContract,
        address creator
    );
    event NFTMinted(address nftContract, uint256 tokenId);
    event OwnerUpdated(address nftContract, uint256 tokenId, address newOwner);
    event ExchangeAddressChanged(address oldExchange, address newExchange);
    event CarbonMintingFactoryFeeVaultSet(address carbonMintingFactoryFeeVault);

    // Address of the wrapped ETH token
    address public immutable ETH;
    // address of the ERC721 NFT Contract
    address public implementation;

    // Address of the exchange contract
    address public exchangeAddress;
    // Address of the carbon minting vault
    address public carbonMintingFactoryFeeVault;

    // address of admin registry contract
    address public adminRegistry;

    // index to track number of nft contract deployed
    uint256 public indexCount = 0;

    // Stores the NFTs per user
    mapping(address => address[]) public creatorToNFTs;
    // nft contract => (token id => owner)
    mapping(address => mapping(uint256 => address)) public nftToIdToOwner;
    // nftContract => ownerAddress
    mapping(address => address) public nftToOwner;

    /**
     * @notice Used to check caller is the owner of that NFT
     *
     * @param _nftContract Address of the NFT
     */
    modifier onlyCreatorAdmin(address _nftContract) {
        require(
            nftToOwner[_nftContract] == msg.sender || IAdminRegistry(adminRegistry).isAdmin(msg.sender),
            "MintingFactory: Only Creator or Admin can call this!"
        );
        _;
    }

    // @notice only admin registry members can call this
    modifier onlyAdminRegistry() {
        require(
            IAdminRegistry(adminRegistry).isAdmin(msg.sender),
            "AdminRegistry: Restricted to admin."
        );
        _;
    }
    /**
     * @notice Used to check the caller is exchange contract
     */
    modifier onlyExchange() {
        require(
            msg.sender == exchangeAddress,
            "MintingFactory: Only Exchange can call this!"
        );
        _;
    }

    /**
     * @notice Constructs the contract
     *
     * @param _eth Address of the wrapped ETH token
     * @param _adminRegistry Address of the Admin Registry contract
     */
    constructor(address _eth, address _adminRegistry, address _implementation) {
        ETH = _eth;
        adminRegistry = _adminRegistry;
        implementation = _implementation;
    }

    /**
     * @notice Creates a new Collection, or deploys a new NFT contract
     * @param _name - name of the ERC721 contract
     * @param _symbol - symbol of the ERC721 contract
     * @param _creator - address of the creator for whom the collection is being created
     * @param _tokenId - starting token id for the collection
     * @return _nftcontract address of the newly minted NFT collection contract
     * Emits an event {CollectionCreated} indicating the contract name, symbol, contract address and the creator addres
     */
    function createCollection(
        string memory _name,
        string memory _symbol,
        address _creator,
        uint256 _tokenId    
    ) external onlyAdminRegistry returns (address _nftcontract) {

        bytes32 _salt = keccak256(abi.encodePacked(indexCount, _name, _symbol, _creator, _tokenId));

        address nftContract = Clones.cloneDeterministic(implementation, _salt);
        IERC721NFTContract(nftContract).initialize(_name, _symbol, _creator, _tokenId);
        indexCount++;

        // update mapping of owner to NFTContracts
        creatorToNFTs[_creator].push(nftContract);
        nftToOwner[nftContract] = _creator;
        ERC721NFTContract(nftContract).setApprovalForAll(exchangeAddress, true);

        emit CollectionCreated(_name, _symbol, nftContract, _creator);
        // return address of new contract
        return nftContract;
    }

    /**
     * @notice Mints an NFT for any NFT contract
     * @param _nftContract - address of the nft contract for which you want to mint a new NFT
     * Emits an event {NFTMinted} indicating the address of the nft contract and the
     * token id of minted tokens
     */
    function mintNFT(address _nftContract)
        external
        onlyCreatorAdmin(_nftContract)
    {
        uint256 _tokenId = ERC721NFTContract(_nftContract).mint();

        emit NFTMinted(_nftContract, _tokenId);
    }

    /**
     * @notice Updates the owner of the NFT in factory records - on-chain book-keeping purposes
     * @param _nftContract - address of the nft contract
     * @param _tokenId - token id of the NFT
     * @param _newOwner - address of the user who's the new owner of the NFT
     * Emits an event {OwnerUpdates} indicating address of nft contract, token id
     * and the new owner of the token
     */
    function updateOwner(
        address _nftContract,
        uint256 _tokenId,
        address _newOwner
    ) external onlyExchange {
        nftToIdToOwner[_nftContract][_tokenId] = _newOwner;

        emit OwnerUpdated(_nftContract, _tokenId, _newOwner);
    }

    /**
     * @notice Updates the address of the Exchange
     * @param _newExchange - address of the new exchange
     * Emits an event {ExchangeAddressChanged} depicting the address of old exchange contract
     * and the new exchange contract
     */
    function updateExchangeAddress(address _newExchange) external onlyAdminRegistry {
        address oldExchange = exchangeAddress;
        exchangeAddress = _newExchange;
        emit ExchangeAddressChanged(oldExchange, exchangeAddress);
    }

    /**
     * @notice set the address of the carbon minting factory fee vault
     * Emits the event {CarbonMintingFactoryFeeVaultSet} indicating the new address
     * of the minting factory fee vault
     */
    function setCarbonMintingFactoryFeeVault(address _mintingFactoryVault)
        external
        onlyAdminRegistry
    {
        require(
            _mintingFactoryVault != address(0),
            "MintingFactory: Vault address cannot be zero"
        );
        carbonMintingFactoryFeeVault = _mintingFactoryVault;

        emit CarbonMintingFactoryFeeVaultSet(_mintingFactoryVault);
    }

    /*
     * @dev lists all collections of a owner
     * @param address of the user
     * @returns lists of user nft collections
     */
    function getNFTsForOwner(address user)
        external
        view
        returns (address[] memory)
    {
        return creatorToNFTs[user];
    }

    /*
     * @dev get total NFTs minted for a contract
     * @param address of nft contract
     * @returns number of nfts minted for the contract
     */
    function getTotalNFTsMinted(address _nftContract)
        external
        view
        returns (uint256)
    {
        return ERC721NFTContract(_nftContract).getTotalNFTs();
    }

    /*
     * @notice Used to get all the admins and access
     * @returns total number of admins and list of admin addresses
     */
    function getRoleMembers()
        external
        view
        returns (uint256, address[] memory)
    {
        return IAdminRegistry(adminRegistry).getRoleMembers();
    }

    /*
     * @dev Adds the admin role for the given address
     * @param address of the user
     */
    function addAdminToRegistry(address _account) external {
        IAdminRegistry(adminRegistry).addAdmin(_account);
    }

    /*
     * @dev Removes the given address from the admin role
     * @param address of the user
     */
    function removeAdminFromRegistry(address _account) external {
        IAdminRegistry(adminRegistry).removeAdmin(_account);
    }

    /*
     * @dev Removes oneself as the admin member of th community
     */
    function leaveFromAdminRegistry() external {
        IAdminRegistry(adminRegistry).leaveRole();
    }
}
