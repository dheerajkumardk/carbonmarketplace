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
  let CollectionFactory: any;
  let collection: any;
  let AdminRegistryFactory: any;
  let adminRegistry: any;
  let ETHTokenFactory: any;
  let weth: any;

  this.beforeAll(async function () {
    accounts = await ethers.getSigners();

    MintingFactoryFactory = await ethers.getContractFactory("MintingFactory");
    CollectionFactory = await ethers.getContractFactory("Collection");
    AdminRegistryFactory = await ethers.getContractFactory("AdminRegistry");
    ETHTokenFactory = await ethers.getContractFactory("ETHToken");
  });

  this.beforeEach(async () => {
    owner = accounts[0];
    user = accounts[1];
    ownerAddress = await accounts[0].getAddress();
    userAddress = await accounts[1].getAddress();

    weth = await ETHTokenFactory.deploy();
    await weth.deployed();
    adminRegistry = await AdminRegistryFactory.deploy(ownerAddress);
    await adminRegistry.deployed();
    collection = await CollectionFactory.deploy();
    await collection.deployed();
    mintingFactory = await MintingFactoryFactory.deploy(weth.address, adminRegistry.address, collection.address);
    await mintingFactory.deployed();
  });

    it('Should create new Collection', async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = await tx.wait();
    
        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
    });

    it('Should mint an NFT for a collection', async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = await tx.wait();
        let nftContract: any;

        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
        nftContract = event?.args?.nftContract;

        // setting carbon vault in admin registry
        let tx11 = await adminRegistry.connect(owner).setCarbonVault(userAddress); 

        let tx81 = await (await mintingFactory.connect(owner).setBaseURI(nftContract, "https://carbon.xyz/")).wait();
        
        console.log("minting nft for this collection");
        
        let tx2 = await mintingFactory["mintNFT(address)"](nftContract);
        const receipt2 = await tx2.wait();
        let event2 = receipt2.events?.find((event: any) => event.event === "NFTMinted");
        console.log("contract: ", event2?.args?.nftContract);
        console.log("token id: ", event2?.args?.tokenId);
        console.log("token id: ", event2?.args?.tokenURI);

        // get NFTs for owner
        let tx3 = await mintingFactory.getNFTsForOwner(ownerAddress);
        console.log(tx3);

        let tx4 = await mintingFactory.getTotalNFTsMinted(nftContract);
        console.log(tx4);
    });

    it('Should mint an NFT for a collection-TokenURI', async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = await tx.wait();
        let nftContract: any;

        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
        nftContract = event?.args?.nftContract;

        // setting carbon vault in admin registry
        let tx11 = await adminRegistry.connect(owner).setCarbonVault(userAddress); 

        console.log("minting nft for this collection");

        let tokenURI = "https://pinata.dheeraj.co/dheeraj_xyz";
        
        let tx2 = await mintingFactory["mintNFT(address,string)"](nftContract, tokenURI);
        const receipt2 = await tx2.wait();
        let event2 = receipt2.events?.find((event: any) => event.event === "NFTMinted");
        console.log("contract: ", event2?.args?.nftContract);
        console.log("token id: ", event2?.args?.tokenId);
        console.log("token id: ", event2?.args?.tokenURI);

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
        const receipt = await tx.wait();

        let event = receipt.events?.find((event: any) => event.event === "ExchangeAddressChanged");
        console.log("old Exchange", event?.args?.oldExchange);
        console.log("new Exchange", event?.args?.newExchange);
    });

    it ('Should get lists of all admin addresses', async () => {
        let tx = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx); 
    });

    it ('Should add new admin to registry', async () => {
        let tx1 = await adminRegistry.connect(owner).addAdmin(mintingFactory.address);

        let tx = await mintingFactory.connect(owner).addAdmin(userAddress);
        // console.log(tx); 
        let tx2 = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx2); 
    });

    it ('Should remove address from admin registry', async () => {
        let tx1 = await adminRegistry.connect(owner).addAdmin(mintingFactory.address);

        let tx = await mintingFactory.connect(owner).removeAdmin(userAddress);
        // console.log(tx); 
    });

    it ('Should leave the admin role', async () => {
        let tx1 = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx1); 
        let tx = await mintingFactory.connect(owner).leaveRole();
        // console.log(tx);
        let tx2 = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx2);  
    });
});


