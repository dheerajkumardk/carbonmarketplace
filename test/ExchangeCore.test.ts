import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("ExchangeCore - executeOrder", function () {
  let account: Signer;
  let account2: Signer;
  let account3: Signer;
  let admin: string;
  let user: string;
  let anotherUser: string;

  let MintingFactory: any;
  let ETHTOKEN: any;
  let EXCHANGE: any;
  let CARBONMEMBERSHIP: any;
  let NFTCONTRACT: any;
  let AdminRegistry: any;

  let mintingFactory: any;
  let eth: any;
  let exchange: any;
  let carbonMembership: any;
  let nftContract: any;
  let adminRegistry: any;

  this.beforeAll(async () => {
    [account, account2, account3] = await ethers.getSigners();
    admin = await account.getAddress();
    user = await account2.getAddress();
    anotherUser = await account3.getAddress();

    ETHTOKEN = await ethers.getContractFactory("ETHToken");
    MintingFactory = await ethers.getContractFactory("MintingFactory");
    CARBONMEMBERSHIP = await ethers.getContractFactory("CarbonMembership");
    EXCHANGE = await ethers.getContractFactory("ExchangeCore");
    NFTCONTRACT = await ethers.getContractFactory("Collection");
    AdminRegistry = await ethers.getContractFactory("AdminRegistry");
  });

  this.beforeEach(async () => {
    eth = await ETHTOKEN.deploy();
    await eth.deployed();

    await (await eth.transfer(user, "100000000000000000000000")).wait();

    adminRegistry = await AdminRegistry.deploy(admin);
    await adminRegistry.deployed();

    nftContract = await NFTCONTRACT.deploy();
    nftContract.deployed();

    mintingFactory = await MintingFactory.deploy(
      eth.address,
      adminRegistry.address,
      nftContract.address
    );
    await mintingFactory.deployed();

    carbonMembership = await CARBONMEMBERSHIP.deploy();
    await carbonMembership.deployed();

    exchange = await EXCHANGE.deploy(
      mintingFactory.address,
      eth.address,
      carbonMembership.address,
      adminRegistry.address,
      admin
    );
    await exchange.deployed();

    await (await adminRegistry.setCarbonVault(admin)).wait();
    await (await mintingFactory.updateExchangeAddress(exchange.address)).wait();
  });

  it("Should test the execute order", async () => {
    let tx = await mintingFactory.createCollection(
      "Carbon Basic",
      "CBN",
      admin,
      1,
      "https://carbon.xyz/"
    );
    let receipt = await tx.wait();

    let event = receipt.events?.find(
      (event: any) => event.event === "CollectionCreated"
    );
    let nftContractAddress = event?.args?.nftContract;

    const newNFT = await NFTCONTRACT.attach(nftContractAddress);
    await (await newNFT.setApprovalForAll(exchange.address, true)).wait();
    tx = await nftContract.isApprovedForAll(admin, exchange.address);

    for (let index = 0; index < 6; index++) {
      let newNFT = await mintingFactory.mintNFT(nftContractAddress);
      receipt = await newNFT.wait();
      event = receipt.events?.find((event: any) => event.event === "NFTMinted");
      let tokenIdMinted = event?.args?.tokenId;
    }

    let allowanceAmt = "100000"; // 1 ETH
    let auctionTime = 1748203441;
    let amount = "1025";
    for (let index = 0; index <= 3; index++) {
      console.log("\nScenario", index + 1);
      // approves amount tokens
      await (
        await eth
          .connect(account2)
          .approve(exchange.address, ethers.utils.parseEther(allowanceAmt))
      ).wait();

      let before = await eth.balanceOf(admin);
      await (
        await exchange
          .connect(account)
          .executeOrder(
            nftContractAddress,
            index + 2,
            user,
            admin,
            ethers.utils.parseEther(amount),
            auctionTime,
            index,
            true
          )
      ).wait();
      let after = await eth.balanceOf(admin);
      console.log("Admin balance diff: ", (after.sub(before)).toString());
    }
  });
});
