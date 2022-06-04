import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("====>Update Contracts<====", function () {
  let accounts: Signer[];
  let admin: string;
  let user: string;
  let ETH: any;
  let weth: any;
  let AdminRegistry: any;
  let adminRegistry: any;
  let CarbonMemberShip: any;
  let carbonMembership: any;
  let MintingFactory: any;
  let mintingFactory: any;
  let Exchange: any;
  let exchange: any;
  let CollectionFactory: any;
  let collection: any;
  let nftContractInstance: any;
  let nftContracts: string[];
  let exchangeAddress: any;
  let nftContractAddress: string;
  let account: Signer;
  let account2: Signer;
  let newExchangeAddress: string;
  let newFactoryAddress: string;

  this.beforeAll(async function () {
    [account, account2] = await ethers.getSigners();

    ETH = await ethers.getContractFactory("ETHToken");
    CarbonMemberShip = await ethers.getContractFactory("CarbonMembership");
    MintingFactory = await ethers.getContractFactory("MintingFactory");
    Exchange = await ethers.getContractFactory("ExchangeCore");
    CollectionFactory = await ethers.getContractFactory("Collection");
    AdminRegistry = await ethers.getContractFactory("AdminRegistry");

    nftContracts = [];
  });
  this.beforeEach(async () => {
    admin = await account.getAddress();
    user = await account2.getAddress();

    adminRegistry = await AdminRegistry.deploy(admin);
    await adminRegistry.deployed();

    weth = await ETH.deploy();
    await weth.deployed();

    collection = await CollectionFactory.deploy();
    collection.deployed();

    mintingFactory = await MintingFactory.deploy(weth.address, adminRegistry.address, collection.address);
    await mintingFactory.deployed();

    carbonMembership = await CarbonMemberShip.deploy();
    await carbonMembership.deployed();

    exchange = await Exchange.deploy(
      mintingFactory.address,
      weth.address,
      carbonMembership.address,
      adminRegistry.address,
      user
    );
    await exchange.deployed();

  });

  it("Should be able to change Exchange Address in Minting Factory", async () => {
    let changeAddress = await mintingFactory
      .connect(account)
      .updateExchangeAddress(exchange.address);
    const receipt = await changeAddress.wait();

    let events = receipt.events?.find((event: any) => event.event === "ExchangeAddressChanged");
    console.log("old Exchange: ", events?.args?.oldExchange);
    console.log("new Exchange: ", events?.args?.newExchange);
  });

  it("Should mint NFT contract in Minting Factory", async () => {
    let tx = await mintingFactory
      .connect(account)
      .createCollection("Gujarat Titans", "GT", admin, 0, "https://carbon.xyz/");
    const receipt = await tx.wait();

    let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
    console.log("name: ", event?.args?.name);
    console.log("symbol: ", event?.args?.symbol);
    console.log("contract: ", event?.args?.nftContract);
    console.log("creator: ", event?.args?.creator);
    
    nftContractAddress = event?.args?.nftContract;
    nftContracts.push(nftContractAddress);
    nftContracts.push(nftContractAddress);
  });

  it("Should mint NFT contract in Minting Factory", async () => {
    let tx = await mintingFactory
      .connect(account)
      .createCollection("Chennai Super Kings", "CSK", admin, 0, "https://carbon.xyz/");
    const receipt = await tx.wait();

    let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
    console.log("name: ", event?.args?.name);
    console.log("symbol: ", event?.args?.symbol);
    console.log("contract: ", event?.args?.nftContract);
    console.log("creator: ", event?.args?.creator);
    
    nftContractAddress = event?.args?.nftContract;
    nftContracts.push(nftContractAddress);
  });

  it("Minting Factory set approval for Exchange Contract", async () => {
    nftContractInstance = await CollectionFactory.attach(nftContractAddress);

    let tx = await nftContractInstance
      .connect(account)
      .setApprovalForAll(exchange.address, true);
  });

  it("Check set Approval of Minting Factory minted contracts to Exchange", async () => {
    let tx = await nftContractInstance.isApprovedForAll(
      admin,
      exchange.address
    );
    console.log("approval", true);
    
  });

  // display all old NFT Contracts
  it("Should list all old NFT contracts", async () => {
    let tx = await mintingFactory.getNFTsForOwner(admin);
    // nftContracts = tx;
    console.log("old contracts: ", nftContracts);
    
  });

  // deploy new factory
  it("Should deploy new factory", async () => {
    mintingFactory = await MintingFactory.deploy(weth.address, adminRegistry.address, collection.address);
    await mintingFactory.deployed();

    newFactoryAddress = mintingFactory.address;
  });

  // deploy new exchange
  it("Should deploy new exchange", async () => {
    exchange = await Exchange.deploy(
      mintingFactory.address,
      weth.address,
      carbonMembership.address,
      adminRegistry.address,
      user
    );
    await exchange.deployed();

    newExchangeAddress = exchange.address;
  });
  // should update factory in Exchange
  it("Should be able to change Exchange Address in Minting Factory", async () => {
    let changeAddress = await mintingFactory
      .connect(account)
      .updateExchangeAddress(newExchangeAddress);
    const receipt = await changeAddress.wait();

    let events = receipt.events?.find((event: any) => event.event === "ExchangeAddressChanged");
    console.log("old Exchange: ", events?.args?.oldExchange);
    console.log("new Exchange: ", events?.args?.newExchange);
    
    newExchangeAddress = events?.args?.newExchange;
    
  });

  // Should update factory in ERC-721 contract
  it("Should update factory in ERC721 NFT Contract", async () => {
    for (let i = 0; i < nftContracts.length; i++) {
      nftContractAddress = nftContracts[i];
      nftContractInstance = await CollectionFactory.attach(nftContractAddress);

      let tx = await nftContractInstance
        .connect(account)
        .updateFactory(newFactoryAddress);
    }
  });

  // next - ERC721 ka factory call, check if it matches that of updated factory
  it("Should check if factory matches", async () => {
    for (let i = 0; i < nftContracts.length; i++) {
      nftContractAddress = nftContracts[i];
      nftContractInstance = await CollectionFactory.attach(nftContractAddress);
      
      expect(await nftContractInstance.factory()).to.equal(newFactoryAddress);
      
    }
  });

  it("Should update factory in Exchange", async () => {
    let tx = await exchange.connect(account).updateFactory(newFactoryAddress);
  });

  it("Minting Factory set approval for Exchange Contract", async () => {
    for (let i = 0; i < nftContracts.length; i++) {
      nftContractAddress = nftContracts[i];
      nftContractInstance = await CollectionFactory.attach(nftContractAddress);

      let tx = await nftContractInstance
        .connect(account)
        .setApprovalForAll(newExchangeAddress, true);
    }
  });
});
