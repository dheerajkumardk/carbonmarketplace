import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("====>AdminRole<====", function () {
  let accounts: Signer[];
  let owner: Signer;
  let user: Signer;
  let ownerAddress: string;
  let userAddress: string;
  let AdminRoleFactory: any;
  let adminRole: any;

  this.beforeAll(async function () {
    accounts = await ethers.getSigners();

    AdminRoleFactory = await ethers.getContractFactory("AdminRole");
  });

  this.beforeEach(async () => {
    owner = accounts[0];
    user = accounts[1];
    ownerAddress = await accounts[0].getAddress();
    userAddress = await accounts[0].getAddress();

    adminRole = await AdminRoleFactory.deploy(ownerAddress);
    await adminRole.deployed();
  });

  it("Should add an admin", async () => {
    let tx = await adminRole.connect(owner).addAdmin(userAddress);
    const receipt = await tx.wait();
  });

  it("Should leave admin role", async () => {
    let tx = await adminRole.connect(owner).leaveRole();
    const receipt = await tx.wait();
  });

  it("Should remove an admin", async () => {
    let tx = await adminRole.connect(owner).removeAdmin(userAddress);
    const receipt = await tx.wait();
  });
});
