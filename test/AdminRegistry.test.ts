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
  let AdminRegistryFactory: any;
  let adminRegistry: any;
  let MintingFactoryFactory: any;
  let mintingFactory: any;

  this.beforeAll(async function () {
    accounts = await ethers.getSigners();

    AdminRegistryFactory = await ethers.getContractFactory("AdminRegistry");
    MintingFactoryFactory = await ethers.getContractFactory("MintingFactory");
  });

  this.beforeEach(async () => {
    owner = accounts[0];
    user = accounts[1];
    ownerAddress = await accounts[0].getAddress();
    userAddress = await accounts[0].getAddress();

    adminRegistry = await AdminRegistryFactory.deploy(ownerAddress);
    await adminRegistry.deployed();
    mintingFactory = await MintingFactoryFactory.deploy('0x259989150c6302D5A7AeEc4DA49ABfe1464C58fE', adminRegistry.address, '0x259989150c6302D5A7AeEc4DA49ABfe1464C58fE');
    await mintingFactory.deployed();
  });

  it ("All common tests for minting admin operations", async () => {
    let tx = await mintingFactory.connect(owner).getRoleMembers();
    console.log("MF", tx);
    let tx2 = await adminRegistry.connect(owner).getRoleMembers();
    console.log("AR", tx2);

    let tx3 = await adminRegistry.connect(owner).addAdmin(mintingFactory.address);
    const receipt = await tx3.wait();
    let tx6 = await mintingFactory.connect(owner).addAdminToRegistry(user.getAddress());
    const receipt2 = await tx6.wait();

    let tx9 = await mintingFactory.connect(owner).addAdminToRegistry('0x259989150c6302D5A7AeEc4DA49ABfe1464C58fE');


    let tx4 = await mintingFactory.getRoleMembers();
    console.log("MF", tx4);
    let tx5 = await adminRegistry.connect(owner).getRoleMembers();
    console.log("AR", tx5);

    let tx7 = await mintingFactory.connect(owner).removeAdminFromRegistry(userAddress);

    let tx10 = await mintingFactory.getRoleMembers();
    console.log("MF", tx10);
    let tx8 = await adminRegistry.connect(owner).getRoleMembers();
    console.log("AR", tx8);

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

    let tx = await mintingFactory.connect(owner).addAdminToRegistry(user.getAddress());
    const receipt = await tx.wait();
    // console.log(receipt);
  });

  it("Should list all admins from Minting factory", async () => {
    let tx = await mintingFactory.connect(owner).getRoleMembers();
    console.log(tx);    
  });

  it("Should remove an admin from minting factory", async () => {
    let tx3 = await adminRegistry.connect(owner).addAdmin(mintingFactory.address);
    let tx = await mintingFactory.connect(owner).removeAdminFromRegistry(userAddress);
    const receipt = await tx.wait();
  });

  it("Should leave admin role from minting factory", async () => {
    let tx = await mintingFactory.connect(owner).leaveFromAdminRegistry();
    const receipt = await tx.wait();
  });

});
