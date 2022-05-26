import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { log } from "console";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("====>Minting Factory Tests<====", function () {
  let accounts: Signer[];
  let owner: Signer;
  let user: Signer;
  let ownerAddress: string;
  let userAddress: string;
  let MintingFactoryFactory: any;
  let mintingFactory: any;
  let ERC721NFTContractFactory: any;
  let erc721nftContract: any;
  let AdminRegistryFactory: any;
  let adminRegistry: any;

  this.beforeAll(async function () {
    accounts = await ethers.getSigners();

    MintingFactoryFactory = await ethers.getContractFactory("MintingFactory");
    ERC721NFTContractFactory = await ethers.getContractFactory("ERC721NFTContract");
    AdminRegistryFactory = await ethers.getContractFactory("AdminRegistry");
  });

  this.beforeEach(async () => {
    owner = accounts[0];
    user = accounts[1];
    ownerAddress = await accounts[0].getAddress();
    userAddress = await accounts[0].getAddress();

    adminRegistry = await AdminRegistryFactory.deploy(ownerAddress);
    await adminRegistry.deployed();
    erc721nftContract = await ERC721NFTContractFactory.deploy();
    await erc721nftContract.deployed();
    mintingFactory = await MintingFactoryFactory.deploy('0x259989150c6302D5A7AeEc4DA49ABfe1464C58fE', adminRegistry.address, erc721nftContract.address);
    await mintingFactory.deployed();
    
  });

    it('Should create new Collection', async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = tx.wait();
    
        mintingFactory.on("CollectionCreated", (_name: any, _symbol: any, _nftContract: any, _creator: any) => {
            console.log(_name, _symbol, _nftContract, _creator);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
    });

    
    it('Should mint an NFT for a collection', async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = tx.wait();
        let nftContract: any;

        mintingFactory.on("CollectionCreated", (_name: any, _symbol: any, _nftContract: any, _creator: any) => {
            nftContract = _nftContract;
            console.log(_name, _symbol, _nftContract, _creator);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        // minting nft for this collection
        let tx2 = await mintingFactory.mintNFT(nftContract);
        mintingFactory.on("NFTMinted", (_nftContract: any, _tokenId: any) => {
            console.log(_nftContract, _tokenId);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        // get NFTs for owner
        let tx3 = await mintingFactory.getNFTsForOwner(ownerAddress);
        console.log(tx3);

        let tx4 = await mintingFactory.getTotalNFTsMinted(nftContract);
        console.log(tx4);
    });

    it('Should return total NFT contract minted by a user', async () => {
        let totalCollections = await mintingFactory.getNFTsForOwner(ownerAddress);
        console.log("total collections: ", totalCollections);
    });

    it('Should be able to change Exchange Address', async () => {
        let tx = await mintingFactory.connect(owner).updateExchangeAddress(userAddress);
        const receipt = tx.wait();

        mintingFactory.on("ExchangeAddressChanged", (_oldAddress: any, _newAddress: any) => {
            console.log(_oldAddress, _newAddress);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
    });

    it ('Should set carbon minting fee vault address', async () => {
        let tx = await mintingFactory.connect(owner).setCarbonMintingFactoryFeeVault(userAddress);
        const receipt = tx.wait();

        mintingFactory.on("CarbonMintingFactoryFeeVaultSet", (_vaultAddress: any) => {
            console.log(_vaultAddress);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
    });

    it ('Should get lists of all admin addresses', async () => {
        let tx = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx); 
    });

    it ('Should add new admin to registry', async () => {
        let tx1 = await adminRegistry.connect(owner).addAdmin(mintingFactory.address);

        let tx = await mintingFactory.connect(owner).addAdminToRegistry(userAddress);
        // console.log(tx); 
        let tx2 = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx2); 
    });

    it ('Should remove address from admin registry', async () => {
        let tx1 = await adminRegistry.connect(owner).addAdmin(mintingFactory.address);

        let tx = await mintingFactory.connect(owner).removeAdminFromRegistry(userAddress);
        // console.log(tx); 
    });

    it ('Should leave the admin role', async () => {
        let tx1 = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx1); 
        let tx = await mintingFactory.connect(owner).leaveFromAdminRegistry();
        // console.log(tx);
        let tx2 = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx2);  
    });
});


