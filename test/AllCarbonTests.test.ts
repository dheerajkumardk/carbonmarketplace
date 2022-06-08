import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { log } from "console";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("====>Minting Tests<====", function () {
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
  let CollectionFactory: any;
  let collection: any;


  this.beforeAll(async function () {
    accounts = await ethers.getSigners();

    CollectionFactory = await ethers.getContractFactory("Collection");
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

    collection = await CollectionFactory.deploy();
    await collection.deployed();

    weth = await ETHTokenFactory.deploy();
    await weth.deployed();
    
    mintingFactory = await MintingFactoryFactory.deploy(weth.address, adminRegistry.address, collection.address);
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

    it('Should create new Collection', async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = await tx.wait();

        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
    });

    it('Should mint an NFT for a collection', async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = await tx.wait();
        let nftContract: any;

        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
        nftContract = event?.args?.nftContract;

        // setting carbon vault in admin registry
        let tx11 = await adminRegistry.connect(owner).setCarbonVault(userAddress); 

        console.log("minting nft for the collection");        
        let tx2 = await mintingFactory["mintNFT(address)"](nftContract);
        const receipt2 = await tx2.wait();
        let event2 = receipt2.events?.find((event: any) => event.event === "NFTMinted");
        console.log("contract: ", event2?.args?.nftContract);
        console.log("token id: ", event2?.args?.tokenId);

        // get NFTs for owner
        let tx3 = await mintingFactory.getNFTsForOwner(ownerAddress);
        console.log(tx3);

        let tx4 = await mintingFactory.getTotalNFTsMinted(nftContract);
        console.log(tx4);
    });

    it('Should return total NFT contract minted by a user', async () => {
        let totalCollections = await mintingFactory.getNFTsForOwner(ownerAddress);
        console.log("total collections: ", totalCollections);
    });

    it('Should be able to change Exchange Address', async () => {
        let tx = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);
        const receipt = await tx.wait();
        let event = receipt.events?.find((event: any) => event.event === "ExchangeAddressChanged");
        console.log("old Exchange: ", event?.args?.oldExchange);
        console.log("new Exchange: ", event?.args?.newExchange);
    });

    it ("Should set base URI for a collection", async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = await tx.wait();

        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
        let nftContract = event?.args?.nftContract;

        // changing base uri
        let tx2 = await mintingFactory.connect(owner).setBaseURI(nftContract, "https://dheeraj.co/");

        let nftContractInst = await CollectionFactory.attach(nftContract);
        console.log("base uri",  await nftContractInst.baseURI());
    });

    it ("should update factory for nft collection", async () => {
        let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        const receipt = await tx.wait();

        let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event?.args?.name);
        console.log("symbol: ", event?.args?.symbol);
        console.log("contract: ", event?.args?.nftContract);
        console.log("creator: ", event?.args?.creator);
        let nftContract = event?.args?.nftContract;

        let nftContractInst = await CollectionFactory.attach(nftContract);
        let tx2 = await nftContractInst.connect(owner).updateFactory(userAddress);
        console.log("factory updated.");
        
    });

    it ('Should get lists of all admin addresses', async () => {
        let tx = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx); 
    });

    it ('Should add new admin to registry', async () => {
        let tx1 = await adminRegistry.connect(owner).addAdmin(mintingFactory.address);

        let tx = await mintingFactory.connect(owner).addAdmin(userAddress);
        // console.log(tx); 
        let tx2 = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx2); 
    });

    it ('Should remove address from admin registry', async () => {
        let tx1 = await adminRegistry.connect(owner).addAdmin(mintingFactory.address);

        let tx = await mintingFactory.connect(owner).removeAdmin(userAddress);
        // console.log(tx); 
    });

    it ('Should leave the admin role', async () => {
        let tx1 = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx1); 
        let tx = await mintingFactory.connect(owner).leaveRole();
        // console.log(tx);
        let tx2 = await mintingFactory.connect(owner).getRoleMembers();
        console.log(tx2);  
    });

    


});

describe("====>Staking<====", function () {
    let accounts: Signer[];
    let owner: Signer;
    let user: Signer;
    let ownerAddress: string;
    let userAddress: string;
    let GEMSTokenFactory: any;
    let gemsToken: any;
    let GEMSNFTFactory: any;
    let gemsNFT: any;
    let GEMSStakingFactory: any;
    let gemsStaking: any;
    let AMOUNT: string;
    let tokenId: number;
  
    this.beforeAll(async function () {
      AMOUNT = "100000000000000000000000";
      tokenId = 1;

      accounts = await ethers.getSigners();
  
      GEMSTokenFactory = await ethers.getContractFactory("GEMSToken");
      GEMSNFTFactory = await ethers.getContractFactory("GEMSNFTReceipt");
      GEMSStakingFactory = await ethers.getContractFactory("GEMSStaking");
    });
  
    this.beforeEach(async () => {
      owner = accounts[0];
      user = accounts[1];
      ownerAddress = await accounts[0].getAddress();
      userAddress = await accounts[1].getAddress();
      
      gemsToken = await GEMSTokenFactory.deploy();
      await gemsToken.deployed();
  
      gemsNFT = await GEMSNFTFactory.deploy("GEMS NFT Receipt", "GEMNFT", ownerAddress);
      await gemsNFT.deployed();
      
      gemsStaking = await GEMSStakingFactory.deploy(gemsToken.address, gemsNFT.address);
      await gemsStaking.deployed();
      await (await gemsNFT.setStakingPool(gemsStaking.address)).wait();
    });

    it("Approve user tokens to Staking contract", async () => {
        let approveGEM = await gemsToken.approve(gemsStaking.address, AMOUNT);
      });
    
    it("Should call stake function", async () => {
        await (await gemsToken.approve(gemsStaking.address, AMOUNT)).wait();
        let staketxn = await gemsStaking.stake(ownerAddress, AMOUNT);
        const receipt = await staketxn.wait();
        
        let event = receipt.events?.find((event: any) => event.event === "Staked");        
        console.log(event?.args?.user, " has staked ", event?.args?.amount.toString(), " tokens.");
    
        let tx = await gemsNFT.ownerOf("1");
        console.log("owner of GEMS NFT Receipt 1: ", tx);
    });
    
    it("Should call unstake function", async () => {
        await (await gemsToken.approve(gemsStaking.address, AMOUNT)).wait();
        await (await gemsStaking.connect(owner).stake(ownerAddress, AMOUNT)).wait();

        let unstakeTxn = await gemsStaking.unstake();
        const receipt = await unstakeTxn.wait();
        let event = receipt.events?.find((event: any) => event.event === "UnStaked");        
        console.log(event?.args?.user, " has unstaken ", event?.args?.amount.toString(), " tokens.");
    });
});

describe("====>Exchange<====", function () {
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
    let CollectionFactory: any;
    let collection: any;
  
    this.beforeAll(async function () {
      accounts = await ethers.getSigners();
  
      CollectionFactory = await ethers.getContractFactory("Collection");
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
  
      collection = await CollectionFactory.deploy();
      await collection.deployed();
  
      weth = await ETHTokenFactory.deploy();
      await weth.deployed();
      
      mintingFactory = await MintingFactoryFactory.deploy(weth.address, adminRegistry.address, collection.address);
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

    it('Should Approve some tokens for Buy Order to the Exchange', async () => {
        let allowanceAmt = "100000";
        let tx = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));
    })

    it('Should execute the order in Exchange - Mode 0', async () => {
        let tx6 = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);

        console.log("\n");
        let nftContract: any;
        let tokenId = 100;
        let auctionTime = 1748203441;
        let amount = "1025";

        // mint collection
        console.log("collection is getting minted");
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
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
        let tx2 = await mintingFactory["mintNFT(address)"](nftContract);
        // approval to exchange
        let nftContractInst = await CollectionFactory.attach(nftContract);
        let tx3 = await nftContractInst.connect(user).setApprovalForAll(exchangeCore.address, true); 
        let tx33 = await nftContractInst.isApprovedForAll(userAddress, exchangeCore.address);
        console.log("approval: ", tx33);

        // token allowance
        console.log("token approval and updating exchange address in factory...\n");
        let allowanceAmt = "100000"; // 1 ETH
        let tx4 = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));

        console.log("user bal before execute order:", (await weth.balanceOf(ownerAddress)).toString());
        let executeOrder = await exchangeCore.connect(owner).executeOrder(nftContract, tokenId, ownerAddress, mintingFactory.address, ethers.utils.parseEther(amount), auctionTime, 1, true);

        console.log("user bal after execute order:", (await weth.balanceOf(ownerAddress)).toString());
    });

    it('Should cancel the order in Exchange', async () => {
        console.log("\n");
        let nftContract: any;
        let tokenId = 100;
        let auctionTime = 1748203441;
        let amount = "1025";

        // mint collection
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        let receipt1 = await tx1.wait();
        let event1 = receipt1.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event1?.args?.name);
        console.log("symbol: ", event1?.args?.symbol);
        console.log("contract: ", event1?.args?.nftContract);
        console.log("creator: ", event1?.args?.creator);
        nftContract = event1?.args?.nftContract;
        let tx5 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        // mint token
        let tx2 = await mintingFactory["mintNFT(address)"](nftContract);
        // approval to exchange
        let nftContractInst = await CollectionFactory.attach(nftContract);
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
        let tx6 = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);

        console.log("\n");
        let nftContract: any;
        let tokenId = 100;
        let auctionTime = 1748203441;
        let amount = "1025";

        // mint collection
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        let receipt1 = await tx1.wait();
        let event1 = receipt1.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event1?.args?.name);
        console.log("symbol: ", event1?.args?.symbol);
        console.log("contract: ", event1?.args?.nftContract);
        console.log("creator: ", event1?.args?.creator);
        nftContract = event1?.args?.nftContract;
        let tx5 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        // mint token
        let tx2 = await mintingFactory["mintNFT(address)"](nftContract);
        // approval to exchange
        let nftContractInst = await CollectionFactory.attach(nftContract);
        let tx3 = await nftContractInst.connect(user).setApprovalForAll(exchangeCore.address, true); 
        let tx33 = await nftContractInst.isApprovedForAll(userAddress, exchangeCore.address);
        console.log("approval: ", tx33);

        // token allowance
        let allowanceAmt = "100000"; // 1 ETH
        let tx4 = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));

        console.log("cancelling order...");
        let tx = await exchangeCore.connect(owner).cancelOrder(nftContract, tokenId, ownerAddress);
        console.log("order cancelled.");

        console.log("executing order...");
        try {
            let executeOrder = await exchangeCore.connect(owner).executeOrder(nftContract, tokenId, ownerAddress, mintingFactory.address, ethers.utils.parseEther(amount), auctionTime, 0, true);
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
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        let receipt1 = await tx1.wait();
        let event1 = receipt1.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event1?.args?.name);
        console.log("symbol: ", event1?.args?.symbol);
        console.log("contract: ", event1?.args?.nftContract);
        console.log("creator: ", event1?.args?.creator);
        nftContract = event1?.args?.nftContract;
        let tx5 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        // mint token
        let tx2 = await mintingFactory["mintNFT(address)"](nftContract);
        // approval to exchange
        let nftContractInst = await CollectionFactory.attach(nftContract);
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
        let tx6 = await mintingFactory.connect(owner).updateExchangeAddress(exchangeCore.address);

        console.log("\n");
        let nftContract: any;
        let tokenId = 100;
        let auctionTime = 1748203441;
        let amount = "1025";

        // mint collection
        let tx1 = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", ownerAddress, 99);
        let receipt1 = await tx1.wait();
        let event1 = receipt1.events?.find((event: any) => event.event === "CollectionCreated");
        console.log("name: ", event1?.args?.name);
        console.log("symbol: ", event1?.args?.symbol);
        console.log("contract: ", event1?.args?.nftContract);
        console.log("creator: ", event1?.args?.creator);
        nftContract = event1?.args?.nftContract;
        let tx5 = await adminRegistry.connect(owner).setCarbonVault(userAddress);

        // mint token
        let tx2 = await mintingFactory["mintNFT(address)"](nftContract);
        // approval to exchange
        let nftContractInst = await CollectionFactory.attach(nftContract);
        let tx3 = await nftContractInst.connect(user).setApprovalForAll(exchangeCore.address, true); 
        let tx33 = await nftContractInst.isApprovedForAll(userAddress, exchangeCore.address);
        console.log("approval: ", tx33);

        // token allowance
        let allowanceAmt = "100000"; // 1 ETH
        let tx4 = await weth.connect(owner).approve(exchangeCore.address, ethers.utils.parseEther(allowanceAmt));
        

        console.log("cancelling order...");
        let orderCancel = await exchangeCore.connect(owner).cancelOrder(nftContract, tokenId, ownerAddress);
        console.log("order cancelled.\nuncancelling order...");

        let orderUncancel = await exchangeCore.connect(owner).uncancelOrder(nftContract, tokenId, ownerAddress);
        console.log("order uncancelled.");
        let executeOrder = await exchangeCore.connect(owner).executeOrder(nftContract, tokenId, ownerAddress, mintingFactory.address, ethers.utils.parseEther(amount), auctionTime, 0, true);
    });

    it ("Should update address of minting factory", async () => {
        let tx = await exchangeCore.connect(owner).updateFactory(mintingFactory.address);
        const receipt = await tx.wait();
        let event = receipt.events?.find((event: any) => event.event === "MintingFactoryUpdate");
        console.log("factory address: ", event?.args?._mintingFactory);
    });

    it ("Should set buyers premium fees", async () => {
        let fees = 35;
        let tx = await exchangeCore.connect(owner).setBuyerPremiumFees(fees);
        const receipt = await tx.wait();
        let event = receipt.events?.find((event: any) => event.event === "BuyerPremiumFeesSet");
        console.log("buyers premium fees: ", event?.args?._feePercent.toString());
    });

    it ("Should update charity address", async () => {
        let tx = await exchangeCore.connect(owner).updateCharity(userAddress);
        const receipt = await tx.wait();
        let event = receipt.events?.find((event: any) => event.event === "CharityWalletUpdate");
        console.log("new charity address: ", event?.args?._newCharity);
    });

    it('Should pause the Exchange contract', async () => {
        let tx = await exchangeCore.connect(owner).pause();
    });

    it('Should unpause the Exchange contract', async () => {
        let tx = await exchangeCore.connect(owner).pause();

        let tx2 = await exchangeCore.connect(owner).unpause();
    });

    it('Should add admin to registry via Exchange', async () => {
        let tx1 = await adminRegistry.connect(owner).addAdmin(exchangeCore.address);
        let tx = await exchangeCore.connect(owner).addAdmin(userAddress);

        let tx2 = await adminRegistry.connect(owner).getRoleMembers();
        console.log("admin addresses: ", tx2);
    });

    it('Should remove admin from registry via Exchange', async () => {
        let tx1 = await adminRegistry.connect(owner).addAdmin(exchangeCore.address);
        let tx = await exchangeCore.connect(owner).removeAdmin(userAddress);
    });

    it('Should leave admin role from registry via Exchange', async () => {
        let tx = await exchangeCore.connect(owner).leaveRole();
    });

    it('Should list all admin addresses', async () => {
        let tx = await exchangeCore.connect(owner).getRoleMembers();
        console.log("admin addresses: ", tx);
        
    });
  
});

describe("====>Membership<====", function () {
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
  
      carbonMembership = await CarbonMembershipFactory.deploy();
      await carbonMembership.deployed();
      gemsToken = await GEMSTokenFactory.deploy();
      await gemsToken.deployed();
      membershipTrader = await MembershipTraderFactory.deploy(gemsToken.address, carbonMembership.address);
      await membershipTrader.deployed();
    });

    it('Should approve funds to membership trader', async () => {
        let tx = await gemsToken.connect(owner).approve(membershipTrader.address, 100000);
        console.log("allowance of: ",(await gemsToken.allowance(ownerAddress, membershipTrader.address)).toString(), " tokens");
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
        console.log("user bal. ", (await carbonMembership.balanceOf(ownerAddress)).toString());
    });

    it('Should set carbon fee vault', async () => {
        let tx = await membershipTrader.connect(owner).setCarbonFeeVault(userAddress);
    });

    it('Should unpause the Carbon Membership Contract', async () => {
        let tx = carbonMembership.connect(owner).unpause();
    });

    it('Should update owner for Carbon Membership', async () => {
        let tx = carbonMembership.connect(owner).updateOwner(userAddress);
    });

    it('Should update owner for Membership Trader', async () => {
        let tx = membershipTrader.connect(owner).updateOwner(userAddress);
    });
});

describe("====>Admin Registry<====", function () {
    let accounts: Signer[];
    let owner: Signer;
    let user: Signer;
    let ownerAddress: string;
    let userAddress: string;
    let AdminRegistryFactory: any;
    let adminRegistry: any;
  
    this.beforeAll(async function () {
      accounts = await ethers.getSigners();
  
      AdminRegistryFactory = await ethers.getContractFactory("AdminRegistry");
    });
  
    this.beforeEach(async () => {
      owner = accounts[0];
      user = accounts[1];
      ownerAddress = await accounts[0].getAddress();
      userAddress = await accounts[1].getAddress();
  
      adminRegistry = await AdminRegistryFactory.deploy(ownerAddress);
      await adminRegistry.deployed();
    });
    
    it("Should check if the address is an admin", async () => {
        let tx = await adminRegistry.isAdmin(ownerAddress);
        console.log(tx);  
        expect(tx).to.equal(true);  
    });
    
    it("Should add an admin", async () => {
        let tx = await adminRegistry.connect(owner).addAdmin(userAddress);
        const receipt = await tx.wait();
        console.log(userAddress, " has been given admin role");
        
    });
    
    it("Should list all admins", async () => {
        let tx = await adminRegistry.connect(owner).getRoleMembers();
        console.log(tx);
        expect(tx[1][0]).to.equal(`${ownerAddress}`);
    });
    
    it("Should remove an admin", async () => {
        let tx = await adminRegistry.connect(owner).removeAdmin(userAddress);
        const receipt = await tx.wait();
        console.log(userAddress, " has been removed from admin role");

    });
    
    it("Should leave admin role", async () => {
        let tx = await adminRegistry.connect(owner).leaveRole();
        const receipt = await tx.wait();
        console.log(ownerAddress, " has been given up their admin role");

    });

    it ('Should set up carbon vault', async () => {
        let tx = await adminRegistry.connect(owner).setCarbonVault(userAddress);
    })  
});
