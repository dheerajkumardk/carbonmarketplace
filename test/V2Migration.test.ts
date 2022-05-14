import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("Update Contracts", function () {
  let accounts: Signer[];
  let admin: string;
  let user: string;
  let ETH: any;
  let CarbonMemberShip: any;
  let MintingFactory: any;
  let Exchange: any;
  let NFT: any;
  let mintingFactory: any;
  let nftContract: any;
  let exchange: any;
  let eth: any;
  let carbonMembership: any;
  let nftContracts: string[];
  let exchangeAddress: any;
  let nftContractAddress: string;
  let account: Signer;
  let account2: Signer;
  let newExchangeAddress: string;
  let newFactoryAddress: string;
  let nftContractAdmin: string;

  this.beforeAll(async function () {
    [account, account2] = await ethers.getSigners();

    ETH = await ethers.getContractFactory("ETHToken");
    CarbonMemberShip = await ethers.getContractFactory("CarbonMembership");
    MintingFactory = await ethers.getContractFactory("MintingFactory");
    Exchange = await ethers.getContractFactory("ExchangeCore");
    NFT = await ethers.getContractFactory("ERC721NFTContract");

    nftContracts = [];
  });
  this.beforeEach(async () => {
    admin = await account.getAddress();
    user = await account2.getAddress();

    eth = await ETH.deploy();
    await eth.deployed();

    mintingFactory = await MintingFactory.deploy(eth.address, admin);
    await mintingFactory.deployed();

    carbonMembership = await CarbonMemberShip.deploy();
    await carbonMembership.deployed();

    exchange = await Exchange.deploy(
      mintingFactory.address,
      eth.address,
      carbonMembership.address,
      admin
    );
    await exchange.deployed();

    nftContract = await NFT.deploy("Lux Lame", "LLM", admin, 0);
    nftContract.deployed();
  });

  it("Should be able to change Exchange Address in Minting Factory", async () => {
    let changeAddress = await mintingFactory
      .connect(account)
      .updateExchangeAddress(exchange.address);
    await changeAddress.wait();

    mintingFactory.on(
      "ExchangeAddressChanged",
      (_oldAddress: string, _newAddress: string) => {}
    );
    await new Promise((res) => setTimeout(() => res(null), 5000));
  });

  it("Should mint NFT contract in Minting Factory", async () => {
    let tx = await mintingFactory
      .connect(account)
      .createCollection("Royal Challengers Bangalore", "RCB", admin, 0);

    mintingFactory.on(
      "CollectionCreated",
      (_name: string, _symbol: string, _nftContract: string) => {
        nftContractAddress = _nftContract;
      }
    );
    await new Promise((res) => setTimeout(() => res(null), 5000));
  });
  it("Should mint NFT contract in Minting Factory", async () => {
    let tx = await mintingFactory
      .connect(account)
      .createCollection("Chennai Super Kings", "CSK", admin, 0);

    mintingFactory.on(
      "CollectionCreated",
      (_name: string, _symbol: string, _nftContract: string) => {
        nftContractAddress = _nftContract;
        //
      }
    );
    await new Promise((res) => setTimeout(() => res(null), 5000));
  });
  it("Should mint NFT contract in Minting Factory", async () => {
    let tx = await mintingFactory
      .connect(account)
      .createCollection("Mumbai Indians", "MI", admin, 0);

    mintingFactory.on(
      "CollectionCreated",
      (_name: string, _symbol: string, _nftContract: string) => {
        nftContractAddress = _nftContract;
        //
      }
    );
    await new Promise((res) => setTimeout(() => res(null), 5000));
  });
  it("Should mint NFT contract in Minting Factory", async () => {
    let tx = await mintingFactory
      .connect(account)
      .createCollection("Rajasthan Royals", "RR", admin, 0);

    mintingFactory.on(
      "CollectionCreated",
      (_name: string, _symbol: string, _nftContract: string) => {
        nftContractAddress = _nftContract;
        //
      }
    );
    await new Promise((res) => setTimeout(() => res(null), 5000));
  });
  it("Should mint NFT contract in Minting Factory", async () => {
    let tx = await mintingFactory
      .connect(account)
      .createCollection("Deccan Chargers", "DC", admin, 0);

    mintingFactory.on(
      "CollectionCreated",
      (_name: string, _symbol: string, _nftContract: string) => {
        nftContractAddress = _nftContract;
        //
      }
    );
    await new Promise((res) => setTimeout(() => res(null), 5000));
  });

  it("Minting Factory set approval for Exchange Contract", async () => {
    nftContract = await NFT.attach(nftContractAddress);
    nftContractAdmin = await nftContract.admin();

    let tx = await nftContract
      .connect(account)
      .setApprovalForAll(exchange.address, true);
  });

  it("Check set Approval of Minting Factory minted contracts to Exchange", async () => {
    let tx = await nftContract.isApprovedForAll(
      nftContractAdmin,
      exchange.address
    );
  });

  // display all old NFT Contracts
  it("Should list all old NFT contracts", async () => {
    let tx = await mintingFactory.getNFTsForOwner(admin);
    nftContracts = tx;
  });

  // deploy new factory
  it("Should deploy new factory", async () => {
    const MintingFactory = await ethers.getContractFactory("MintingFactory");
    mintingFactory = await MintingFactory.deploy(eth.address, admin);
    await mintingFactory.deployed();

    newFactoryAddress = mintingFactory.address;
    //
  });

  // deploy new exchange
  it("Should deploy new exchange", async () => {
    const ExchangeCore = await ethers.getContractFactory("ExchangeCore");
    exchange = await ExchangeCore.deploy(
      mintingFactory.address,
      eth.address,
      carbonMembership.address,
      admin
    );
    await exchange.deployed();

    newExchangeAddress = exchange.address;
  });
  // should update factory in Exchange
  it("Should be able to change Exchange Address in Minting Factory", async () => {
    let changeAddress = await mintingFactory
      .connect(account)
      .updateExchangeAddress(newExchangeAddress);
    await changeAddress.wait();

    mintingFactory.on(
      "ExchangeAddressChanged",
      (_oldAddress: string, _newAddress: string) => {
        newExchangeAddress = _newAddress;
      }
    );
    await new Promise((res) => setTimeout(() => res(null), 5000));
  });

  // Should update factory in ERC-721 contract
  it("Should update factory in ERC721 NFT Contract", async () => {
    for (let i = 0; i < nftContracts.length; i++) {
      nftContractAddress = nftContracts[i];
      nftContract = await NFT.attach(newFactoryAddress);

      let tx = await nftContract
        .connect(account)
        .updateFactory(newFactoryAddress);
    }
  });

  // next - ERC721 ka factory call, check if it matches that of updated factory
  it("Should check if factory matches", async () => {
    for (let i = 0; i < nftContracts.length; i++) {
      nftContractAddress = nftContracts[i];
      nftContract = await NFT.attach(newFactoryAddress);
    }
  });

  it("Should update factory in Exchange", async () => {
    let tx = await exchange.connect(account).updateFactory(newFactoryAddress);
  });

  it("Minting Factory set approval for Exchange Contract", async () => {
    for (let i = 0; i < nftContracts.length; i++) {
      nftContractAddress = nftContracts[i];
      nftContract = await NFT.attach(newFactoryAddress);
      nftContractAdmin = await nftContract.admin();

      let tx = await nftContract
        .connect(account)
        .setApprovalForAll(newExchangeAddress, true);
    }
  });
});
