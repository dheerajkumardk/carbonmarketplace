import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("====>Minting Factory Create2<====", function () {
  let accounts: Signer[];
  let owner: Signer;
  let user: Signer;
  let ownerAddress: string;
  let userAddress: string;
  let AdminRegistryFactory: any;
  let adminRegistry: any;
  let MintingFactoryFactory: any;
  let mintingFactory: any;
  let CollectionFactory: any;
  let collection: any;
  let ETHTokenFactory: any;
  let weth: any;

  this.beforeAll(async function () {
    accounts = await ethers.getSigners();

    AdminRegistryFactory = await ethers.getContractFactory("AdminRegistry");
    MintingFactoryFactory = await ethers.getContractFactory("MintingFactory");
    CollectionFactory = await ethers.getContractFactory("Collection");
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

  it ("Should create NFT contract using CREATE2", async () => {
    let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
    const receipt = await tx.wait();
    
    let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
    console.log("name: ", event?.args?.name);
    console.log("symbol: ", event?.args?.symbol);
    console.log("contract: ", event?.args?.nftContract);
    console.log("creator: ", event?.args?.creator);
    
  });
  
  it ("Should mint NFT for the contract", async () => {
      let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
      const receipt = await tx.wait();
      let nftContract: any;

      let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
      console.log("name: ", event?.args?.name);
      console.log("symbol: ", event?.args?.symbol);
      console.log("contract: ", event?.args?.nftContract);
      console.log("creator: ", event?.args?.creator);
      nftContract = event?.args?.nftContract;
      
      console.log("setting carbon vault...");
      
      let tx11 = await adminRegistry.connect(owner).setCarbonVault(userAddress); 

      console.log("minting nft for the collection");
      
      let tx2 = await mintingFactory["mintNFT(address)"](nftContract);
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

});
