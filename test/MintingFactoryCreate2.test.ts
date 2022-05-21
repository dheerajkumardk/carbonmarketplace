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
  let ERC721NFTContractFactory: any;
  let erc721nftContract: any;

  this.beforeAll(async function () {
    accounts = await ethers.getSigners();

    AdminRegistryFactory = await ethers.getContractFactory("AdminRegistry");
    MintingFactoryFactory = await ethers.getContractFactory("MintingFactory");
    ERC721NFTContractFactory = await ethers.getContractFactory("ERC721NFTContract");
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

  it ("Should create NFT contract using CREATE2", async () => {
    let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
    const receipt = tx.wait();
    // console.log(tx);  
    
    mintingFactory.on("CollectionCreated", (_name: any, _symbol: any, _nftContract: any, _creator: any) => {
        console.log(_name, _symbol, _nftContract, _creator);
    });
    await new Promise(res => setTimeout(() => res(null), 5000));
    
})
});
