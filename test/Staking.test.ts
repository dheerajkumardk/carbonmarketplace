import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("====>Staking<====", function () {
  let account: Signer;
  let account2: Signer;
  let GemToken: any;
  let GemNFT: any;
  let GemStaking: any;
  let gemToken: any;
  let gemNft: any;
  let gemStaking: any;
  let AMOUNT: string;
  let tokenId: number;

  this.beforeAll(async () => {
    AMOUNT = "100000000000000000000000";
    tokenId = 1;

    GemToken = await ethers.getContractFactory("GEMSToken");
    GemNFT = await ethers.getContractFactory("GEMSNFTReceipt");
    GemStaking = await ethers.getContractFactory("GEMSStaking");
  });
  this.beforeEach(async () => {
    [account, account2] = await ethers.getSigners();

    gemToken = await GemToken.deploy();
    gemToken.deployed();

    gemNft = await GemNFT.deploy(
      "Carbon Gems",
      "CGEM",
      await account.getAddress()
    );
    await gemNft.deployed();

    gemStaking = await GemStaking.deploy(gemToken.address, gemNft.address);
    await gemStaking.deployed();
    await (await gemNft.setStakingPool(gemStaking.address)).wait();
  });

  it("Approve user tokens to Staking contract", async () => {
    let approveGEM = await gemToken.approve(gemStaking.address, AMOUNT);
  });

  it("Should call stake function", async () => {
    await (await gemToken.approve(gemStaking.address, AMOUNT)).wait();
    let staketxn = await gemStaking.stake(await account.getAddress(), AMOUNT);
    await staketxn.wait();

    let user, amount;
    gemStaking.on("Staked", (_user: string, _amount: string) => {
      user = _user;
      amount = _amount;
    });
    await new Promise((res) => setTimeout(() => res(null), 5000));

    console.log(user, " has staked ", amount, " tokens.");

    let tx = await gemNft.ownerOf("1");
    console.log(tx);
  });

  it("Should call unstake function", async () => {
    await (await gemToken.approve(gemStaking.address, AMOUNT)).wait();
    await (
      await gemStaking
        .connect(account)
        .stake(await account.getAddress(), AMOUNT)
    ).wait();
    let unstakeTxn = await gemStaking.unstake();

    let user, amount;
    gemStaking.on("UnStaked", (_user: string, _amount: string) => {
      user = _user;
      amount = _amount;
    });
    await new Promise((res) => setTimeout(() => res(null), 5000));

    console.log(user, " has unstaken ", amount, " tokens.");
  });
});
