import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
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
        console.log("\n");
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
        const receipt = await tx.wait();
    
        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
        
    });

    it('Minting Factory set approval for Exchange Contract', async () => {
        console.log("\n");
        let nftContract: any;

        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
        const receipt = await tx1.wait();
        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);

        nftContract = event?.args?.nftContract;

        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx = await nftContractInst.connect(owner).setApprovalForAll(exchangeCore.address, true);
    });

    it('Check set Approval of Minting Factory minted contracts to Exchange', async () => {
        console.log("\n");
        let nftContract: any;

        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
        const receipt = await tx1.wait();
    
        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
        nftContract = event?.args?.nftContract;

        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx2 = await nftContractInst.connect(owner).setApprovalForAll(exchangeCore.address, true);
        
        let tx = await nftContractInst.isApprovedForAll(ownerAddress, exchangeCore.address);
        console.log("approval: ", tx);
    });

    it('Should mint an NFT for a contract from Minting Factory - 01', async () => {
        console.log("\n");
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
        const receipt = await tx.wait();
        let nftContract: any;

        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
        nftContract = event?.args?.nftContract;

        console.log("\nbefore minting tokens, setting up the carbon vault...\n");
        let tx3 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        // minting nft for this collection
        let tx2 = await mintingFactory.mintNFT(nftContract);
        const receipt2 = await tx2.wait();
        let event2 = receipt2.events?.find((event: any) => event.event === "NFTMinted");
        console.log("contract: ", event2?.args?.nftContract);
        console.log("token id: ", event2?.args?.tokenId.toString());
    });

    it('Should Approve some tokens for Buy Order to the Exchange', async () => {
        let allowanceAmt = "100000";
        let tx = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));
    })

    it('Should execute the order in Exchange - Mode 0', async () => {
        console.log("\n");
        let nftContract: any;
        let tokenId = 100;
        let auctionTime = 1748203441;
        let amount = "1025";

        // mint collection
        console.log("collection is getting minted");
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
        let receipt1 = await tx1.wait();
        let event1 = receipt1.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event1?.args?.name);
        console.log("symbol: ", event1?.args?.symbol);
        console.log("contract: ", event1?.args?.nftContract);
        console.log("creator: ", event1?.args?.creator);
        nftContract = event1?.args?.nftContract;

        console.log("\nsetting up carbon vault in admin registry...\nMinting nft now...");
        let tx5 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        // mint token
        let tx2 = await mintingFactory.mintNFT(nftContract);
        // approval to exchange
        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx3 = await nftContractInst.connect(user).setApprovalForAll(exchangeCore.address, true); 
        let tx33 = await nftContractInst.isApprovedForAll(userAddress, exchangeCore.address);
        console.log("approval: ", tx33);

        // token allowance
        console.log("token approval and updating exchange address in factory...\n");
        let allowanceAmt = "100000"; // 1 ETH
        let tx4 = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));
        let tx6 = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);

        console.log("user bal before execute order:", (await weth.balanceOf(ownerAddress)).toString());
        let executeOrder = await exchangeCore.connect(owner).executeOrder(nftContract, tokenId, ownerAddress, userAddress, ethers.utils.parseEther(amount), auctionTime, 1, true);

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
        // set membershipTrader, approve funds and set carbon vault
        console.log("\nsetting up membership trader...\napproving funds...\nsetting carbon fee vault...\n");
        
        let tx1 = await carbonMembership.connect(owner).setMembershipTrader(membershipTrader.address);
        let tx2 = await gemsToken.connect(owner).approve(membershipTrader.address, 100000);
        let tx3 = membershipTrader.connect(owner).setCarbonFeeVault(userAddress);

        console.log("gems bal. membership Trader before : ", (await gemsToken.balanceOf(userAddress)).toString());
        console.log("membership pass, user bal. before ", (await carbonMembership.balanceOf(ownerAddress)).toString());

        let tx = await membershipTrader.connect(owner).executeOrder(ownerAddress);

        console.log("gems bal. membership Trader after : ", (await gemsToken.balanceOf(userAddress)).toString());
        console.log("membership pass, user bal. after ", (await carbonMembership.balanceOf(ownerAddress)).toString());
    });

    it('Should execute the order in Exchange - With Membership Pass - Mode 0', async () => {
        console.log("\n");
        let nftContract: any;
        let tokenId = 100;
        let auctionTime = 1748203441;
        let amount = "1025";

        // mint collection
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
        let receipt1 = await tx1.wait();
        let event1 = receipt1.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event1?.args?.name);
        console.log("symbol: ", event1?.args?.symbol);
        console.log("contract: ", event1?.args?.nftContract);
        console.log("creator: ", event1?.args?.creator);
        nftContract = event1?.args?.nftContract;
        let tx5 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        // mint token
        let tx2 = await mintingFactory.mintNFT(nftContract);
        // approval to exchange
        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx3 = await nftContractInst.connect(user).setApprovalForAll(exchangeCore.address, true); 
        let tx33 = await nftContractInst.isApprovedForAll(userAddress, exchangeCore.address);
        console.log("approval: ", tx33);

        // token allowance
        let allowanceAmt = "100000"; // 1 ETH
        let tx4 = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));
        // update Exchange Address
        let tx6 = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);

        // membership pass
        console.log("\nmembership pass minting...\n");
        let tx11 = await carbonMembership.connect(owner).setMembershipTrader(membershipTrader.address);
        let tx12 = await gemsToken.connect(owner).approve(membershipTrader.address, 100000);
        let tx13 = membershipTrader.connect(owner).setCarbonFeeVault(userAddress);

        let tx14 = await membershipTrader.connect(owner).executeOrder(ownerAddress);

        console.log("user bal before execute order:", (await weth.balanceOf(ownerAddress)).toString());
        let executeOrder = await exchangeCore.connect(owner).executeOrder(nftContract, tokenId, ownerAddress, userAddress, ethers.utils.parseEther(amount), auctionTime, 0, true);
        console.log("user bal after execute order:", (await weth.balanceOf(ownerAddress)).toString());
    });

    it('Should cancel the order in Exchange', async () => {
        console.log("\n");
        let nftContract: any;
        let tokenId = 100;
        let auctionTime = 1748203441;
        let amount = "1025";

        // mint collection
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
        let receipt1 = await tx1.wait();
        let event1 = receipt1.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event1?.args?.name);
        console.log("symbol: ", event1?.args?.symbol);
        console.log("contract: ", event1?.args?.nftContract);
        console.log("creator: ", event1?.args?.creator);
        nftContract = event1?.args?.nftContract;
        let tx5 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        // mint token
        let tx2 = await mintingFactory.mintNFT(nftContract);
        // approval to exchange
        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx3 = await nftContractInst.connect(user).setApprovalForAll(exchangeCore.address, true); 
        let tx33 = await nftContractInst.isApprovedForAll(userAddress, exchangeCore.address);
        console.log("approval: ", tx33);

        // token allowance
        let allowanceAmt = "100000"; // 1 ETH
        let tx4 = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));
        let tx6 = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);

        console.log("cancelling order...");
        let tx = await exchangeCore.connect(owner).cancelOrder(nftContract, tokenId, ownerAddress);
        console.log("order cancelled.");
    });

    it('Should execute the order in Exchange - With Membership Pass - Mode 0 - Cancel Order', async () => {
        console.log("\n");
        let nftContract: any;
        let tokenId = 100;
        let auctionTime = 1748203441;
        let amount = "1025";

        // mint collection
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
        let receipt1 = await tx1.wait();
        let event1 = receipt1.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event1?.args?.name);
        console.log("symbol: ", event1?.args?.symbol);
        console.log("contract: ", event1?.args?.nftContract);
        console.log("creator: ", event1?.args?.creator);
        nftContract = event1?.args?.nftContract;
        let tx5 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        // mint token
        let tx2 = await mintingFactory.mintNFT(nftContract);
        // approval to exchange
        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx3 = await nftContractInst.connect(user).setApprovalForAll(exchangeCore.address, true); 
        let tx33 = await nftContractInst.isApprovedForAll(userAddress, exchangeCore.address);
        console.log("approval: ", tx33);

        // token allowance
        let allowanceAmt = "100000"; // 1 ETH
        let tx4 = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));
        let tx6 = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);

        // membership pass
        console.log("\nmembership pass minting...\n");
        let tx11 = await carbonMembership.connect(owner).setMembershipTrader(membershipTrader.address);
        let tx12 = await gemsToken.connect(owner).approve(membershipTrader.address, 100000);
        let tx13 = membershipTrader.connect(owner).setCarbonFeeVault(userAddress);
        let tx14 = await membershipTrader.connect(owner).executeOrder(ownerAddress);
        
        console.log("cancelling order...");
        let tx = await exchangeCore.connect(owner).cancelOrder(nftContract, tokenId, ownerAddress);
        console.log("order cancelled.");

        console.log("executing order...");
        try {
            let executeOrder = await exchangeCore.connect(owner).executeOrder(nftContract, tokenId, ownerAddress, userAddress, ethers.utils.parseEther(amount), auctionTime, 0, true);
        } catch (error: any) {
            expect(error.message).to.equal(`VM Exception while processing transaction: reverted with reason string 'ExchangeCore: Order is cancelled'`);
        }
    });

    it('Should uncancel the order in Exchange', async () => {
        console.log("\n");
        let nftContract: any;
        let tokenId = 100;
        let auctionTime = 1748203441;
        let amount = "1025";

        // mint collection
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
        let receipt1 = await tx1.wait();
        let event1 = receipt1.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event1?.args?.name);
        console.log("symbol: ", event1?.args?.symbol);
        console.log("contract: ", event1?.args?.nftContract);
        console.log("creator: ", event1?.args?.creator);
        nftContract = event1?.args?.nftContract;
        let tx5 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        // mint token
        let tx2 = await mintingFactory.mintNFT(nftContract);
        // approval to exchange
        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx3 = await nftContractInst.connect(user).setApprovalForAll(exchangeCore.address, true); 
        let tx33 = await nftContractInst.isApprovedForAll(userAddress, exchangeCore.address);
        console.log("approval: ", tx33);

        // token allowance
        let allowanceAmt = "100000"; // 1 ETH
        let tx4 = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));
        let tx6 = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);

        console.log("cancelling order...");
        let tx7 = await exchangeCore.connect(owner).cancelOrder(nftContract, tokenId, ownerAddress);
        console.log("order cancelled.\nuncancelling order...")

        let tx = await exchangeCore.connect(owner).uncancelOrder(nftContract, tokenId, ownerAddress);
        console.log("order uncancelled.");
        
    });

    it('Should execute the order in Exchange - With Membership Pass - Mode 0 - Order uncancelled', async () => {
        console.log("\n");
        let nftContract: any;
        let tokenId = 100;
        let auctionTime = 1748203441;
        let amount = "1025";

        // mint collection
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99, "https://carbon.xyz/");
        let receipt1 = await tx1.wait();
        let event1 = receipt1.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event1?.args?.name);
        console.log("symbol: ", event1?.args?.symbol);
        console.log("contract: ", event1?.args?.nftContract);
        console.log("creator: ", event1?.args?.creator);
        nftContract = event1?.args?.nftContract;
        let tx5 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        // mint token
        let tx2 = await mintingFactory.mintNFT(nftContract);
        // approval to exchange
        let nftContractInst = await ERC721NFTContractFactory.attach(nftContract);
        let tx3 = await nftContractInst.connect(user).setApprovalForAll(exchangeCore.address, true); 
        let tx33 = await nftContractInst.isApprovedForAll(userAddress, exchangeCore.address);
        console.log("approval: ", tx33);

        // token allowance
        let allowanceAmt = "100000"; // 1 ETH
        let tx4 = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));
        let tx6 = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);

        // membership pass
        console.log("\nmembership pass minting...\n");
        let tx11 = await carbonMembership.connect(owner).setMembershipTrader(membershipTrader.address);
        let tx12 = await gemsToken.connect(owner).approve(membershipTrader.address, 100000);
        let tx13 = membershipTrader.connect(owner).setCarbonFeeVault(userAddress);
        let tx14 = await membershipTrader.connect(owner).executeOrder(ownerAddress);

        console.log("cancelling order...");
        let orderCancel = await exchangeCore.connect(owner).cancelOrder(nftContract, tokenId, ownerAddress);
        console.log("order cancelled.\nuncancelling order...");

        let orderUncancel = await exchangeCore.connect(owner).uncancelOrder(nftContract, tokenId, ownerAddress);
        console.log("order uncancelled.");
        let executeOrder = await exchangeCore.connect(owner).executeOrder(nftContract, tokenId, ownerAddress, userAddress, ethers.utils.parseEther(amount), auctionTime, 0, true);
    });

});