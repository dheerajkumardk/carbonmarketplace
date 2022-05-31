import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("====>Admin Registry<====", function () {
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

  it ("All tests for minting admin operations", async () => {
    console.log("List of admins");
    let tx = await mintingFactory.connect(owner).getRoleMembers();
    console.log("Minting Factory admins", tx);
    let tx2 = await adminRegistry.connect(owner).getRoleMembers();
    console.log("Admin Registry admins", tx2);

    console.log("Adding admins");
    let tx3 = await adminRegistry.connect(owner).addAdmin(mintingFactory.address);
    const receipt = await tx3.wait();
    let tx6 = await mintingFactory.connect(owner).addAdmin(userAddress);
    const receipt2 = await tx6.wait();

    let tx9 = await mintingFactory.connect(owner).addAdmin(userAddress2);

    console.log("list of admins");
    let tx4 = await mintingFactory.getRoleMembers();
    console.log("Minting Factory admins", tx4);
    let tx5 = await adminRegistry.connect(owner).getRoleMembers();
    console.log("Admin Registry admins", tx5);

    console.log("remove admin from minting interface");
    let tx7 = await mintingFactory.connect(owner).removeAdmin(userAddress);

    console.log("lists admin addresses");
    
    let tx10 = await mintingFactory.getRoleMembers();
    console.log("Minting Factory admins", tx10);
    let tx8 = await adminRegistry.connect(owner).getRoleMembers();
    console.log("Admin Registry admins", tx8);

  });

//   it("Should check if the address is an admin", async () => {
//     let tx = await adminRegistry.isAdmin(userAddress);
//     console.log(tx);    
//   });

  it("Should add an admin", async () => {
    let tx = await adminRegistry.connect(owner).addAdmin(userAddress);
    const receipt = await tx.wait();
  });

  it("Should list all admins", async () => {
    let tx = await adminRegistry.connect(owner).getRoleMembers();
    console.log(tx);
    expect(tx[1][0]).to.equal(`${ownerAddress}`);
  });

  it("Should remove an admin", async () => {
    let tx = await adminRegistry.connect(owner).removeAdmin(userAddress);
    const receipt = await tx.wait();
});

  it("Should leave admin role", async () => {
    let tx = await adminRegistry.connect(owner).leaveRole();
    const receipt = await tx.wait();
  });

  // Calling these from minting factory
  it("Should add an admin from minting factory", async () => {
    let tx3 = await adminRegistry.connect(owner).addAdmin(mintingFactory.address);

    let tx = await mintingFactory.connect(owner).addAdmin(userAddress);
    const receipt = await tx.wait();
    // console.log(receipt);
  });

  it("Should list all admins from Minting factory", async () => {
    let tx = await mintingFactory.connect(owner).getRoleMembers();
    
    expect(tx[1][0]).to.equal(`${ownerAddress}`);    
  });

  it("Should remove an admin from minting factory", async () => {
    let tx3 = await adminRegistry.connect(owner).addAdmin(mintingFactory.address);
    let tx = await mintingFactory.connect(owner).removeAdmin(userAddress);
    const receipt = await tx.wait();
  });

  it("Should leave admin role from minting factory", async () => {
    let tx = await mintingFactory.connect(owner).leaveRole();
    const receipt = await tx.wait();
  });

});
