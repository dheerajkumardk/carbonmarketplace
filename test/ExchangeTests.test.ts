import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, BigNumber } from "ethers";
import { log } from "console";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("====>Exchange Tests<====", function () {
  let accounts: Signer[];
  let owner: Signer;
  let user: Signer;
  let ownerAddress: string;
  let userAddress: string;
  let MintingFactoryFactory: any;
  let mintingFactory: any;
  let ExchangeCoreFactory: any;
  let exchangeCore: any;
  let GEMSTokenFactory: any;
  let gemsToken: any;
  let AdminRegistryFactory: any;
  let adminRegistry: any;
  let CarbonMembershipFactory: any;
  let carbonMembership: any;
  let MembershipTraderFactory: any;
  let membershipTrader: any;
  let ETHTokenFactory: any;
  let weth: any;
  let ERC721NFTContractFactory: any;
  let erc721nftContract: any;


  this.beforeAll(async function () {
    accounts = await ethers.getSigners();

    ERC721NFTContractFactory = await ethers.getContractFactory("ERC721NFTContract");
    MintingFactoryFactory = await ethers.getContractFactory("MintingFactory");
    ExchangeCoreFactory = await ethers.getContractFactory("ExchangeCore");
    GEMSTokenFactory = await ethers.getContractFactory("GEMSToken");
    AdminRegistryFactory = await ethers.getContractFactory("AdminRegistry");
    CarbonMembershipFactory = await ethers.getContractFactory("CarbonMembership");
    MembershipTraderFactory = await ethers.getContractFactory("MembershipTrader");
    ETHTokenFactory = await ethers.getContractFactory("ETHToken");
  });

  this.beforeEach(async () => {
    owner = accounts[0];
    user = accounts[1];
    ownerAddress = await accounts[0].getAddress();
    userAddress = await accounts[1].getAddress();

    adminRegistry = await AdminRegistryFactory.deploy(ownerAddress);
    await adminRegistry.deployed();

    erc721nftContract = await ERC721NFTContractFactory.deploy();
    await erc721nftContract.deployed();

    weth = await ETHTokenFactory.deploy();
    await weth.deployed();
    
    mintingFactory = await MintingFactoryFactory.deploy(weth.address, adminRegistry.address, erc721nftContract.address);
    await mintingFactory.deployed();
    
    carbonMembership = await CarbonMembershipFactory.deploy();
    await carbonMembership.deployed();

    gemsToken = await GEMSTokenFactory.deploy();
    await gemsToken.deployed();

    membershipTrader = await MembershipTraderFactory.deploy(gemsToken.address, carbonMembership.address);
    await membershipTrader.deployed();
    
    exchangeCore = await ExchangeCoreFactory.deploy(mintingFactory.address, weth.address, carbonMembership.address, adminRegistry.address, userAddress);
    await exchangeCore.deployed();
  });

    it('Should be able to change Exchange Address in Minting Factory', async () => {
        let tx = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);
        const receipt = await tx.wait();

        let event = receipt.events?.find((event: any) => event.event === "ExchangeAddressChanged");
        console.log("old exchange: ", event?.args?.oldExchange);
        console.log("new exchange: ", event?.args?.newExchange);
    });

    it('Should set Carbon Vault in Admin Registry', async () => {
        let tx = await adminRegistry.connect(owner).setCarbonVault(userAddress);
        // console.log(tx);
    });

    it ('Should set Carbon Fee Vault in membership trader', async () => {
        let tx = membershipTrader.connect(owner).setCarbonFeeVault(userAddress);
    });

    it('Should mint NFT contract in Minting Factory', async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = await tx.wait();
    
        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
        
    });

    it('Minting Factory set approval for Exchange Contract', async () => {
        let nftContract: any;

        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = tx1.wait();
    
        mintingFactory.on("CollectionCreated", (_name: any, _symbol: any, _nftContract: any, _creator: any) => {
            nftContract = _nftContract;
            console.log(_name, _symbol, _nftContract, _creator);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx = await nftContractInst.connect(owner).setApprovalForAll(exchangeCore.address, true);
    });
    it('Check set Approval of Minting Factory minted contracts to Exchange', async () => {
        let nftContract: any;

        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = tx1.wait();
    
        mintingFactory.on("CollectionCreated", (_name: any, _symbol: any, _nftContract: any, _creator: any) => {
            nftContract = _nftContract;
            console.log(_name, _symbol, _nftContract, _creator);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx2 = await nftContractInst.connect(owner).setApprovalForAll(exchangeCore.address, true);
        
        let tx = await nftContractInst.isApprovedForAll(ownerAddress, exchangeCore.address);
        console.log(tx);
    });

    // Minting 6 NFTs for the NFTContract
    it('Should mint an NFT for a contract from Minting Factory - 01', async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = tx.wait();
        let nftContract: any;

        mintingFactory.on("CollectionCreated", (_name: any, _symbol: any, _nftContract: any, _creator: any) => {
            nftContract = _nftContract;
            console.log(_name, _symbol, _nftContract, _creator);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        // minting nft for this collection
        let tx2 = await mintingFactory.mintNFT(nftContract);
        mintingFactory.on("NFTMinted", (_nftContract: any, _tokenId: any) => {
            console.log(_nftContract, _tokenId);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
    });

    it('Should Approve some tokens for Buy Order to the Exchange', async () => {
        let allowanceAmt = "100000"; // 1 ETH
        let tx = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));
    })

    it('Should execute the order in Exchange - Mode 0', async () => {
        let nftContract: any;
        let tokenId = 100;
        let auctionTime = 1748203441;
        const time = BigNumber.from(3441);
        let amount = "1025";

        // mint collection
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        mintingFactory.on("CollectionCreated", (_name: any, _symbol: any, _nftContract: any, _creator: any) => {
            nftContract = _nftContract;
            console.log(_name, _symbol, _nftContract, _creator);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        // mint token
        let tx2 = await mintingFactory.mintNFT(nftContract);
        // approval to exchange
        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx3 = await nftContractInst.connect(owner).setApprovalForAll(exchangeCore.address, true);
        // token allowance
        let allowanceAmt = "100000"; // 1 ETH
        let tx4 = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));
        let tx5 = await exchangeCore.connect(owner).setCarbonFeeVaultAddress(userAddress);
        let tx6 = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);

        console.log("user bal before execute order:", (await weth.balanceOf(ownerAddress)).toString());
        let executeOrder = await exchangeCore.connect(owner).executeOrder(nftContract, tokenId, ownerAddress, userAddress, ethers.utils.parseEther(amount), auctionTime, 0, true);

        console.log("user bal after execute order:", (await weth.balanceOf(ownerAddress)).toString());
    });

    it('Should set Membership Trader in Carbon Membership Contract', async () => {
        let tx = await carbonMembership.connect(owner).setMembershipTrader(membershipTrader.address);
    });

    it('Should approve funds in GEMS Token to membership trader', async () => {
        let tx = await gemsToken.connect(owner).approve(membershipTrader.address, 100000);
        
        console.log((await gemsToken.allowance(ownerAddress, membershipTrader.address)).toString());
    });

    it('Should execute the order for Membership pass', async () => {
        console.log("bal. membership Trader before : ", (await gemsToken.balanceOf(membershipTrader.address)).toString());
        console.log("user bal. before ", (await carbonMembership.balanceOf(ownerAddress)).toString());

        let tx = await membershipTrader.connect(owner).executeOrder(ownerAddress);

        // console.log(tx);
        console.log("bal. membership Trader after : ", (await gemsToken.balanceOf(membershipTrader.address)).toString());
        console.log("user bal. after ", (await carbonMembership.balanceOf(ownerAddress)).toString());
    });

    it('Should execute the order in Exchange - With Membership Pass - Mode 0', async () => {
        let nftContract: any;
        let auctionTime = 1748203441;
        let amount = "1025";
        let tokenId: any;

        console.log("user bal before execute order:", (await weth.balanceOf(ownerAddress)).toString());
        let executeOrder = await exchangeCore.connect(owner).executeOrder(nftContract, tokenId, ownerAddress, userAddress, ethers.utils.parseEther(amount), auctionTime, 0);
        console.log("user bal after execute order:", (await weth.balanceOf(ownerAddress)).toString());

    });

    it('Should cancel the order in Exchange', async () => {
        let nftContract: any;
        let tokenId: any;
        let tx = await exchangeCore.connect(owner).cancelOrder(nftContract, tokenId, ownerAddress);
        // console.log(cancelOrder);
    });

    it('Should execute the order in Exchange - With Membership Pass - Mode 0 - Cancel Order', async () => {
        let nftContract: any;
        let auctionTime = 1748203441;
        let amount = "1025";
        let tokenId: any;

        console.log("user bal before execute order:", (await weth.balanceOf(ownerAddress)).toString());
        let executeOrder = await exchangeCore.connect(owner).executeOrder(nftContract, tokenId, userAddress, adminRegistry.address, ethers.utils.parseEther(amount), auctionTime, 0);
        console.log("user bal after execute order:", (await weth.balanceOf(ownerAddress)).toString());

    });

    it('Should uncancel the order in Exchange', async () => {
        let nftContract: any;
        let tokenId: any;
        let cancelOrder = await exchangeCore.connect(owner).uncancelOrder(nftContract, tokenId, ownerAddress);
    });

    it('Should execute the order in Exchange - With Membership Pass - Mode 0 - Order uncancelled', async () => {
        let nftContract: any;
        let tokenId: any;
        let auctionTime = 1748203441;
        let amount = "1025";

        console.log("user bal before execute order:", (await weth.balanceOf(ownerAddress)).toString());
        let executeOrder = await exchangeCore.connect(owner).executeOrder(nftContract, tokenId, userAddress, ownerAddress, ethers.utils.parseEther(amount), auctionTime, 0);
        console.log("user bal after execute order:", (await weth.balanceOf(ownerAddress)).toString());

    });

});