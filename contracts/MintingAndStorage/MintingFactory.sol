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
    address public immutable ETH;
    address public carbonMintingFactoryFeeVault;

    // @param - root - address to be set as the admin for the AdminRole contract
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
    event CarbonMintingFactoryFeeVaultSet(address carbonMintingFactoryFeeVault);

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

    /*
    * @notice Creates a new Collection, or deploys a new NFT contract
    * @param _name - name of the ERC721 contract
    * @param _symbol - symbol of the ERC721 contract
    * @param _creator - address of the creator for whom the collection is being created
    * @param _tokenId - starting token id for the collection
    * @returns the address of the newly minted NFT collection contract
    * Emits an event {NFTContractCreated} indicating the contract name, symbol, contract address and the creator addres
    */
    function createCollection(
        string memory _name,
        string memory _symbol,
        address _creator,
        uint256 _tokenId
    ) external onlyAdmin returns (address _nftcontract) {
        // create new contract
        address nftContract = address(
            new ERC721NFTContract(_name, _symbol, msg.sender, _tokenId)
        );
        // update mapping of owner to NFTContracts
        ownerToNFTs[_creator].push(nftContract);
        nftToOwner[nftContract] = _creator;
        ERC721NFTContract(nftContract).setApprovalForAll(exchangeAddress, true);

        emit NFTContractCreated(_name, _symbol, nftContract, _creator);
        // return address of new contract
        return nftContract;
    }

    /*
    * @notice Mints an NFT for any NFT contract
    * @param _nftContract - address of the nft contract for which you want to mint a new NFT
    * Emits an event {NFTMinted} indicating the address of the nft contract and the 
    * token id of minted tokens
    */
    function mintNFT(address _nftContract)
        public
        onlyCreatorAdmin(_nftContract)
    {
        uint256 _tokenId = ERC721NFTContract(_nftContract).mint();

        emit NFTMinted(_nftContract, _tokenId);
    }

    /*
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
    ) public onlyExchange {
        nftToIdToOwner[_nftContract][_tokenId] = _newOwner;

        emit OwnerUpdated(_nftContract, _tokenId, _newOwner);
    }

    /*
    * @notice Updates the address of the Exchange
    * @param _newExchange - address of the new exchange
    * Emits an event {ExchangeAddressChanged} depicting the address of old exchange contract 
    * and the new exchange contract
    */
    function updateExchangeAddress(address _newExchange) public onlyAdmin {
        address oldExchange = exchangeAddress;
        exchangeAddress = _newExchange;
        emit ExchangeAddressChanged(oldExchange, exchangeAddress);
    }

    /*
    * @dev lists all collections of a owner 
    */
    function getNFTsForOwner(address user)
        public
        view
        returns (address[] memory)
    {
        return ownerToNFTs[user];
    }

    /*
    * @dev get total NFTs minted for a contract
    */
    function getTotalNFTsMinted(address _nftContract)
        public
        view
        returns (uint256)
    {
        return ERC721NFTContract(_nftContract).getTotalNFTs();
    }

    // function transferFunds() external onlyAdmin {
    //     uint256 totalBalance = IERC20(ETH).balanceOf(address(this));
    //     IERC20(ETH).transfer(carbonMintingFactoryFeeVault, totalBalance);
    // }

    /*
    * @notice set the address of the carbon minting factory fee vault
    * Emits the event {CarbonMintingFactoryFeeVaultSet} indicating the new address 
    * of the minting factory fee vault 
    */
    function setCarbonMintingFactoryFeeVault(address _mintingFactoryVault)
        external
        onlyAdmin
    {
        require(
            _mintingFactoryVault != address(0),
            "Vault address cannot be zero"
        );
        carbonMintingFactoryFeeVault = _mintingFactoryVault;

        emit CarbonMintingFactoryFeeVaultSet(_mintingFactoryVault);
    }
}
