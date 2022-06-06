import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("====>Membership Tests<====", function () {
  let accounts: Signer[];
  let owner: Signer;
  let user: Signer;
  let ownerAddress: string;
  let userAddress: string;
  let GEMSTokenFactory: any;
  let gemsToken: any;
  let CarbonMembershipFactory: any;
  let carbonMembership: any;
  let MembershipTraderFactory: any;
  let membershipTrader: any;

  this.beforeAll(async function () {
    accounts = await ethers.getSigners();

    GEMSTokenFactory = await ethers.getContractFactory("GEMSToken");
    CarbonMembershipFactory = await ethers.getContractFactory("CarbonMembership");
    MembershipTraderFactory = await ethers.getContractFactory("MembershipTrader");
  });

  this.beforeEach(async () => {
    owner = accounts[0];
    user = accounts[1];
    ownerAddress = await accounts[0].getAddress();
    userAddress = await accounts[1].getAddress();

    gemsToken = await GEMSTokenFactory.deploy();
    await gemsToken.deployed();
    carbonMembership = await CarbonMembershipFactory.deploy();
    await carbonMembership.deployed();
    membershipTrader = await MembershipTraderFactory.deploy(gemsToken.address, carbonMembership.address);
    await membershipTrader.deployed();
  });


    it('Should approve funds to membership trader', async () => {
        let tx = await gemsToken.connect(owner).approve(membershipTrader.address, 100000);
        console.log("allowance of: ", (await gemsToken.allowance(ownerAddress, membershipTrader.address)).toString(), " tokens.");
    });

    it('Should set Membership Trader', async () => {
        let tx = await carbonMembership.connect(owner).setMembershipTrader(membershipTrader.address);
        // console.log(tx);
    });

    it('Should pause the Carbon Membership Contract', async () => {
        let tx = carbonMembership.connect(owner).pause();
        // console.log(tx);
    });

    it('Should execute the order', async () => {
        let tx1 = await gemsToken.connect(owner).approve(membershipTrader.address, 100000);
        let tx2 = await membershipTrader.connect(owner).setCarbonFeeVault(userAddress);
        let tx3 = await carbonMembership.connect(owner).setMembershipTrader(membershipTrader.address);

        let tx = await membershipTrader.connect(owner).executeOrder(ownerAddress);
        // console.log(tx);
        console.log("user bal. ", await carbonMembership.balanceOf(ownerAddress));
    });

    it('Should set carbon fee vault', async () => {
        let tx = await membershipTrader.connect(owner).setCarbonFeeVault(userAddress);
    });

    it('Should unpause the Carbon Membership Contract', async () => {
        let tx = carbonMembership.connect(owner).unpause();
        console.log(tx);
    });

    it('Should update owner for Carbon Membership', async () => {
        let tx = carbonMembership.connect(owner).updateOwner(userAddress);
    });

    it('Should update owner for Membership Trader', async () => {
        let tx = membershipTrader.connect(owner).updateOwner(userAddress);
    });

});
// Mint NFT
// Pause the function
// unpause the function
// Change owner
// Execute order
// Redeem GEMS 