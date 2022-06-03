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
  let ETHTokenFactory: any;
  let weth: any;

  this.beforeAll(async function () {
    accounts = await ethers.getSigners();

    MintingFactoryFactory = await ethers.getContractFactory("MintingFactory");
    ERC721NFTContractFactory = await ethers.getContractFactory("ERC721NFTContract");
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
    erc721nftContract = await ERC721NFTContractFactory.deploy();
    await erc721nftContract.deployed();
    mintingFactory = await MintingFactoryFactory.deploy(weth.address, adminRegistry.address, erc721nftContract.address);
    await mintingFactory.deployed();
  });

    it('Should create new Collection', async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
        const receipt = await tx.wait();
    
        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
    });

    it('Should mint an NFT for a collection', async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
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

        // minting nft for this collection
        let tx2 = await mintingFactory.mintNFT(nftContract);
        const receipt2 = await tx2.wait();
        let event2 = receipt2.events?.find((event: any) => event.event === "NFTMinted");
        console.log("contract: ", event2?.args?.nftContract);
        console.log("token id: ", event2?.args?.tokenId);

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

        mintingFactory.on("ExchangeAddressChanged", (_oldAddress: any, _newAddress: any) => {
            console.log(_oldAddress, _newAddress);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
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


