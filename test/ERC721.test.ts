import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("====>ERC 721 Tests<====", function () {
  let accounts: Signer[];
  let owner: Signer;
  let user: Signer;
  let ownerAddress: string;
  let userAddress: string;
  let userAddress2: string;
  let AdminRegistryFactory: any;
  let adminRegistry: any;
  let MintingFactoryFactory: any;
  let mintingFactory: any;
  let WETHTokenFactory: any;
  let WETHToken: any;
  let ERC721NFTContractFactory: any;
  let erc721nftContract: any;

  this.beforeAll(async function () {
    accounts = await ethers.getSigners();

    ERC721NFTContractFactory = await ethers.getContractFactory("ERC721NFTContract");
    WETHTokenFactory = await ethers.getContractFactory("ETHToken");
    AdminRegistryFactory = await ethers.getContractFactory("AdminRegistry");
    MintingFactoryFactory = await ethers.getContractFactory("MintingFactory");
  });

  this.beforeEach(async () => {
    owner = accounts[0];
    user = accounts[1];
    ownerAddress = await accounts[0].getAddress();
    userAddress = await accounts[1].getAddress();
    userAddress2 = await accounts[2].getAddress();

    WETHToken = await WETHTokenFactory.deploy();
    await WETHToken.deployed();

    erc721nftContract = await ERC721NFTContractFactory.deploy();
    await erc721nftContract.deployed();

    adminRegistry = await AdminRegistryFactory.deploy(ownerAddress);
    await adminRegistry.deployed();

    mintingFactory = await MintingFactoryFactory.deploy(WETHToken.address, adminRegistry.address, erc721nftContract.address);
    await mintingFactory.deployed();
  });

  it ("Should create new NFT collection", async () => {
    console.log("creating nft collection...");
    
    let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 0, "https://carbon.xyz/");
        const receipt = await tx.wait();
        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);

        console.log("\n");
        
        let nftContract: any;
        nftContract = event?.args?.nftContract;

        let tx3 = await adminRegistry.connect(owner).setCarbonVault(userAddress);
        console.log("minting nfts...");
        
        let tx2 = await mintingFactory.mintNFT(nftContract);
        const receipt2 = await tx2.wait();
        let event2 = receipt2.events?.find((event: any) => event.event === "NFTMinted");
        console.log("contract: ", event2?.args.nftContract);
        console.log("token id: ", event2?.args.tokenId.toString());

        let tx5 = await mintingFactory.mintNFT(nftContract);
        const receipt5 = await tx5.wait();
        let event5 = receipt5.events?.find((event: any) => event.event === "NFTMinted");
        console.log("contract: ", event5?.args.nftContract);
        console.log("token id: ", event5?.args.tokenId.toString());

        let tx6 = await mintingFactory.mintNFT(nftContract);
        const receipt6 = await tx6.wait();
        let event6 = receipt6.events?.find((event: any) => event.event === "NFTMinted");
        console.log("contract: ", event6?.args.nftContract);
        console.log("token id: ", event6?.args.tokenId.toString());

        console.log("\n");
        
        // querying for base uri
        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tokenId = 3;
        let tx4 = await nftContractInst.tokenURI(tokenId);
        console.log("token uri for token id ", tokenId, ":", tx4);
        expect(tx4).to.equal(`https://carbon.xyz/${tokenId}`);

        let tx7 = await nftContractInst.baseURI();
        console.log("base uri", tx7);
        expect(tx7).to.equal("https://carbon.xyz/");
        
        
        

  });


});
