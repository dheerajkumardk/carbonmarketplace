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
    let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 0, "https://carbon.xyz");
        const receipt = tx.wait();
        let nftContract: any;
    
        mintingFactory.on("CollectionCreated", (_name: any, _symbol: any, _nftContract: any, _creator: any) => {
            nftContract = _nftContract;
            console.log(_name, _symbol, _nftContract, _creator);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        let tx3 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        let tx2 = await mintingFactory.mintNFT(nftContract);
        let tx5 = await mintingFactory.mintNFT(nftContract);
        let tx6 = await mintingFactory.mintNFT(nftContract);

        mintingFactory.on("NFTMinted", (_nftContract: any, _tokenId: any) => {
            console.log(_nftContract, _tokenId);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));


        // querying for base uri
        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx4 = await nftContractInst.tokenURI(2);
        let tx7 = await nftContractInst.baseURI();
        console.log(tx4);
        console.log("base uri", tx7);
        
        
        

  });


});
