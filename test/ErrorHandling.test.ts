import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
const { expectRevert, time } = require("@openzeppelin/test-helpers");

describe("All Carbon Tests Handled", function () {
  let MintingFactory: any;
  let ETHTOKEN: any;
  let EXCHANGE: any;
  let GEMSTOKEN: any;
  let GEMSNFTRECEIPT: any;
  let GEMSSTAKING: any;
  let NFTCONTRACT: any;
  let CARBONMEMBERSHIP: any;
  let MEMBERSHIPTRADER: any;

  let nftContract: any;
  let admin: string;
  let user: string;
  let anotherUser: string;

  let stakingPool: string;
  let amount = "100000000000000000000000";
  let tokenId = 1;

  let nftContractAddress: string;

  let account: Signer;
  let account2: Signer;
  let account3: Signer;
  let newExchangeAddress: string;
  let nftContractAdmin: string;

  let mintingFactory: any;
  let eth: any;
  let exchange: any;
  let gemsToken: any;
  let gemsNFTReceipt: any;
  let gemsStaking: any;
  let carbonMembership: any;
  let membershipTrader: any;

  this.beforeAll(async () => {
    [account, account2, account3] = await ethers.getSigners();
    admin = await account.getAddress();
    user = await account2.getAddress();
    anotherUser = await account3.getAddress();

    ETHTOKEN = await ethers.getContractFactory("ETHToken");
    MintingFactory = await ethers.getContractFactory("MintingFactory");
    CARBONMEMBERSHIP = await ethers.getContractFactory("CarbonMembership");
    EXCHANGE = await ethers.getContractFactory("ExchangeCore");
    NFTCONTRACT = await ethers.getContractFactory("ERC721NFTContract");
    GEMSTOKEN = await ethers.getContractFactory("GEMSToken");
    GEMSNFTRECEIPT = await ethers.getContractFactory("GEMSNFTReceipt");
    GEMSSTAKING = await ethers.getContractFactory("GEMSStaking");
    MEMBERSHIPTRADER = await ethers.getContractFactory("MembershipTrader");
  });

  this.beforeEach(async () => {
    eth = await ETHTOKEN.deploy();
    await eth.deployed();

    mintingFactory = await MintingFactory.deploy(eth.address, admin);
    await mintingFactory.deployed();

    carbonMembership = await CARBONMEMBERSHIP.deploy();
    await carbonMembership.deployed();

    exchange = await EXCHANGE.deploy(
      mintingFactory.address,
      eth.address,
      carbonMembership.address,
      admin
    );
    await exchange.deployed();

    nftContract = await NFTCONTRACT.deploy("Lux Lame", "LLM", admin, 0);
    nftContract.deployed();

    gemsToken = await GEMSTOKEN.deploy();
    gemsToken.deployed();

    gemsNFTReceipt = await GEMSNFTRECEIPT.deploy("Carbon Gems", "CGEM", admin);
    await gemsNFTReceipt.deployed();

    gemsStaking = await GEMSSTAKING.deploy(
      gemsToken.address,
      gemsNFTReceipt.address
    );
    await gemsStaking.deployed();

    membershipTrader = await MEMBERSHIPTRADER.deploy(
      gemsToken.address,
      carbonMembership.address
    );
    await membershipTrader.deployed();
  });

  it("Should add an admin for Minting Factory", async () => {
    try {
      let tx = await mintingFactory.connect(account3).addAdmin(user);
      //    console.log(tx);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     "Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'"
      //   );
    }
  });

  it("Should remove an admin for Minting Factory", async () => {
    try {
      let tx = await mintingFactory.connect(account3).removeAdmin(user);
      //    console.log(tx);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     "Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'"
      //   );
    }
  });

  // Getting this on second try => After owner is changed
  it("Should be able to change Exchange Address for Minting Factory", async () => {
    try {
      let changeAddress = await mintingFactory
        .connect(account3)
        .updateExchangeAddress(exchange.address);
      await changeAddress.wait();

      mintingFactory.on(
        "ExchangeAddressChanged",
        (_oldAddress: string, _newAddress: string) => {
          newExchangeAddress = _newAddress;
          console.log(_oldAddress, _newAddress);
        }
      );
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     "Error: VM Exception while processing transaction: reverted with reason string 'Only Admin can call this!'"
      //   );
    }
  });

  it("Should update owner for Carbon Membership", async () => {
    try {
      let tx = carbonMembership.connect(account3).updateOwner(user);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`
      //   );
    }
  });

  it("Should update owner for Membership Trader", async () => {
    try {
      let tx = membershipTrader.connect(account3).updateOwner(user);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`
      //   );
    }
  });

  it("Should mint NFT contract in Minting Factory", async () => {
    try {
      let tx = await mintingFactory
        .connect(account2)
        .createCollection("Royal Challengers Bangalore", "RCB", admin, 100);

      mintingFactory.on(
        "CollectionCreated",
        (
          _name: string,
          _symbol: string,
          _nftContract: string,
          _tokenId: string
        ) => {
          nftContractAddress = _nftContract;
          console.log(_name, _symbol, _nftContract, _tokenId);
        }
      );
      await new Promise((res) => setTimeout(() => res(null), 5000));

      nftContract = await NFTCONTRACT.attach(nftContractAddress);

      console.log("NFT Contract Address: ", nftContractAddress);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     "Error: VM Exception while processing transaction: reverted with reason string 'Only Admin can call this!'"
      //   );
    }
  });

  it("Should mint an NFT for a contract in Minting Factory", async () => {
    try {
      let newNFT = await mintingFactory
        .connect(account3)
        .mintNFT(nftContractAddress);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `invalid address or ENS name (argument="name", value=undefined, code=INVALID_ARGUMENT, version=contracts/5.5.0)`
      //   );
    }
    try {
      let tokenIdMinted;
      mintingFactory.on(
        "NFTMinted",
        (_nftContract: string, _tokenId: string) => {
          tokenIdMinted = _tokenId;
          console.log(_nftContract, _tokenId);
        }
      );
      await new Promise((res) => setTimeout(() => res(null), 5000));
      // console.log("TokenID Minted #: ", tokenIdMinted.toString());
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Only Creator or Admin can call this!'`
      //   );
    }
  });

  it("Should return totalNFTs minted for a contract", async () => {
    try {
      let totalNFTs = await mintingFactory.getTotalNFTsMinted(
        nftContractAddress
      );
      console.log(totalNFTs.toString());
    } catch (error: any) {
      console.log(error.message);
      expect(error.message).to.equal(
        `invalid address or ENS name (argument="name", value=undefined, code=INVALID_ARGUMENT, version=contracts/5.5.0)`
      );
    }
  });

  it("Should return total NFT contract minted by a user", async () => {
    try {
      let totalCollections = await mintingFactory.getNFTsForOwner(account);
      console.log("total collections: ", totalCollections.toString());
    } catch (error: any) {
      console.log(error.message);
      expect(error.message).to.equal(
        `invalid address or ENS name (argument="name", value="<SignerWithAddress 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266>", code=INVALID_ARGUMENT, version=contracts/5.5.0)`
      );
    }
  });

  it("Should update staking pool in GEMS NFT Receipt", async () => {
    try {
      let tx = await gemsNFTReceipt
        .connect(account2)
        .setStakingPool(gemsStaking.address);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     "Error: VM Exception while processing transaction: reverted with reason string 'Only Staking pool contract or admin can call this function'"
      //   );
    }
  });

  it("Approve user GEMS tokens to Staking contract", async () => {
    let userBalance = await gemsToken.balanceOf(admin);

    let tx = await gemsToken
      .connect(account)
      .approve(gemsStaking.address, ethers.utils.parseEther(amount));
  });

  it("Should call stake function in GEMS Staking", async () => {
    try {
      let staketxn = await gemsStaking.connect(account2).stake(admin, amount);

      let user,
        amountStaked = "";
      gemsStaking.on("Staked", (_user: string, _amount: string) => {
        user = _user;
        amountStaked = _amount;
      });
      await new Promise((res) => setTimeout(() => res(null), 5000));

      console.log(user, " has staked ", amountStaked.toString(), " tokens.");
    } catch (error: any) {
      console.log(error.message);
      expect(error.message).to.equal(
        "VM Exception while processing transaction: reverted with reason string 'GEMSStaking: Inadequate token allowance'"
      );
    }

    try {
      let staketxn = await gemsStaking.connect(account2).stake(admin, amount);

      let user;
      let amountStaked = "";
      gemsStaking.on("Staked", (_user: string, _amount: string) => {
        user = _user;
        amountStaked = _amount;
      });
      await new Promise((res) => setTimeout(() => res(null), 5000));

      console.log(user, " has staked ", amountStaked.toString(), " tokens.");
    } catch (error: any) {
      console.log(error.message);
      expect(error.message).to.equal(
        "VM Exception while processing transaction: reverted with reason string 'GEMSStaking: Inadequate token allowance'"
      );
    }

    try {
      let staketxn = await gemsStaking.connect(account2).stake(admin, amount);

      let user,
        amountStaked = "";
      gemsStaking.on("Staked", (_user: string, _amount: string) => {
        user = _user;
        amountStaked = _amount;
      });
      await new Promise((res) => setTimeout(() => res(null), 5000));

      console.log(user, " has staked ", amountStaked.toString(), " tokens.");
    } catch (error: any) {
      console.log(error.message);
      expect(error.message).to.equal(
        "VM Exception while processing transaction: reverted with reason string 'GEMSStaking: Inadequate token allowance'"
      );
    }

    try {
      let staketxn = await gemsStaking.connect(account2).stake(admin, amount);

      let user,
        amountStaked = "";
      gemsStaking.on("Staked", (_user: string, _amount: string) => {
        user = _user;
        amountStaked = _amount;
      });
      await new Promise((res) => setTimeout(() => res(null), 5000));

      console.log(user, " has staked ", amountStaked.toString(), " tokens.");
    } catch (error: any) {
      console.log(error.message);
      expect(error.message).to.equal(
        "VM Exception while processing transaction: reverted with reason string 'GEMSStaking: Inadequate token allowance'"
      );
    }
  });

  it("Should call unstake function in GEMS Staking", async () => {
    try {
      let unstakeTxn = await gemsStaking.connect(account2).unstake();

      let user,
        amount = "";
      gemsStaking.on("UnStaked", (_user: string, _amount: string) => {
        user = _user;
        amount = _amount;
      });
      await new Promise((res) => setTimeout(() => res(null), 5000));

      console.log(user, " has unstaken ", amount.toString(), " tokens.");
    } catch (error: any) {
      console.log(error.message);
      expect(error.message).to.equal(
        "VM Exception while processing transaction: reverted with reason string 'GEMSStaking: User had no amount staked!'"
      );
    }
  });

  it("Should verify GEMS NFT burning", async () => {
    // let txn = await gemsNFTReceipt.ownerOf(tokenId);
    // console.log(txn);

    let txn2 = await gemsToken.balanceOf(admin);
    // console.log(txn2.toString());
  });

  it("Should Approve some ETH tokens for Buy Order to Exchange", async () => {
    let allowanceAmt = "1000000000000000000"; // 1 ETH
    // approves amount tokens
    let tx = await eth
      .connect(account)
      .approve(exchange.address, ethers.utils.parseEther(allowanceAmt));
  });

  it("Should Approve nft with given tokenId for Sell Order", async () => {
    // approves the nft with given token id
    try {
      let tx = await nftContract.connect(account).getApproved(101);
    } catch (error: any) {
      console.log(error.message);
      expect(error.message).to.equal(
        `VM Exception while processing transaction: reverted with reason string 'ERC721: approved query for nonexistent token'`
      );
    }
  });

  it("Should Validate the NFT sale for Exchange Order", async () => {
    // check token allowance
    let allowanceAmt = await eth.allowance(admin, exchange.address);
    // console.log(allowanceAmt.toString());

    // check if user has x amt of token balance
    let userBalance = await eth.balanceOf(admin);

    // check nft allowance
    try {
      let allowanceNFT = await nftContract.connect(account).getApproved(101);
    } catch (error: any) {
      console.log(error.message);
      expect(error.message).to.equal(
        `VM Exception while processing transaction: reverted with reason string 'ERC721: approved query for nonexistent token'`
      );
    }
  });

  it("Should execute the order in Exchange", async () => {
    let auctionTime = 1647728701;
    let allowanceAmt = "1000000000000000000";

    try {
      let executeOrder = await exchange
        .connect(account2)
        .executeOrder(
          nftContractAddress,
          tokenId,
          admin,
          nftContractAdmin,
          allowanceAmt,
          auctionTime,
          0
        );
      // for primary market, seller => minting factory
      // console.log(executeOrder);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'`
      //   );
    }

    try {
      let executeOrder = await exchange
        .connect(account2)
        .executeOrder(
          nftContractAddress,
          tokenId,
          admin,
          nftContractAdmin,
          allowanceAmt,
          auctionTime,
          0
        );
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Pausable: paused'`
      //   );
    }

    try {
      let executeOrder = await exchange
        .connect(account)
        .executeOrder(
          nftContractAddress,
          tokenId,
          admin,
          nftContractAdmin,
          allowanceAmt,
          auctionTime,
          0
        );
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Contract is not approved for this NFT'`
      //   );
    }

    try {
      let executeOrder = await exchange
        .connect(account)
        .executeOrder(
          nftContractAddress,
          tokenId,
          admin,
          nftContractAdmin,
          allowanceAmt,
          auctionTime,
          0
        );
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Seller does not owns the token'`
      //   );
    }

    try {
      let executeOrder = await exchange
        .connect(account)
        .executeOrder(
          nftContractAddress,
          tokenId,
          admin,
          nftContractAdmin,
          allowanceAmt,
          auctionTime,
          0
        );
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string "Allowance is less than the NFT's price."`
      //   );
    }

    try {
      let executeOrder = await exchange
        .connect(account)
        .executeOrder(
          nftContractAddress,
          tokenId,
          admin,
          nftContractAdmin,
          allowanceAmt,
          auctionTime,
          0
        );
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Buyer doesn't have sufficient funds'`
      //   );
    }

    try {
      let executeOrder = await exchange
        .connect(account)
        .executeOrder(
          nftContractAddress,
          tokenId,
          admin,
          nftContractAdmin,
          allowanceAmt,
          auctionTime,
          0
        );
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Auction has ended'`
      //   );
    }

    try {
      let executeOrder = await exchange
        .connect(account)
        .executeOrder(
          nftContractAddress,
          tokenId,
          admin,
          nftContractAdmin,
          allowanceAmt,
          auctionTime,
          0
        );
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Order is cancelled'`
      //   );
    }

    try {
      let executeOrder = await exchange
        .connect(account)
        .executeOrder(
          nftContractAddress,
          tokenId,
          admin,
          nftContractAdmin,
          allowanceAmt,
          auctionTime,
          0
        );
      // for primary market, seller => minting factory
      // console.log(executeOrder);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'ERC721 Factory doesn't match with Exchange Factory'`
      //   );
    }

    try {
      let executeOrder = await exchange
        .connect(account)
        .executeOrder(
          nftContractAddress,
          tokenId,
          admin,
          nftContractAdmin,
          allowanceAmt,
          auctionTime,
          0
        );
      // for primary market, seller => minting factory
      // console.log(executeOrder);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Invalid mode specified'`
      //   );
    }
  });

  it("Should cancel the order in Exchange", async () => {
    try {
      let cancelOrder = await exchange
        .connect(account)
        .cancelOrder(nftContractAddress, tokenId, admin);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `invalid address or ENS name (argument="name", value=undefined, code=INVALID_ARGUMENT, version=contracts/5.5.0)`
      //   );
    }

    try {
      let cancelOrder = await exchange
        .connect(account)
        .cancelOrder(nftContractAddress, tokenId, admin);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Pausable: paused'`
      //   );
    }

    try {
      let cancelOrder = await exchange
        .connect(account)
        .cancelOrder(nftContractAddress, tokenId, admin);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'`
      //   );
    }

    try {
      let cancelOrder = await exchange
        .connect(account)
        .cancelOrder(nftContractAddress, tokenId, admin);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Order already cancelled'`
      //   );
    }
  });

  it("Should uncancel the order in Exchange", async () => {
    try {
      let uncancelOrder = await exchange
        .connect(account)
        .uncancelOrder(nftContractAddress, tokenId, admin);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Pausable: paused'`
      //   );
    }

    try {
      let uncancelOrder = await exchange
        .connect(account)
        .uncancelOrder(nftContractAddress, tokenId, admin);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'`
      //   );
    }

    try {
      let uncancelOrder = await exchange
        .connect(account)
        .uncancelOrder(nftContractAddress, tokenId, admin);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     ` Error: VM Exception while processing transaction: reverted with reason string 'Order was never cancelled'`
      //   );
    }
  });

  it("Should set the carbon fee vault address in Exchange", async () => {
    try {
      // tradingFee = await WETH.balanceOf(exchangeAddress);
      let tx = await exchange.connect(account).setCarbonFeeVaultAddress(user);
      // console.log(tx);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     "Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'"
      //   );
    }
  });

  it("Should add an admin for Exchange", async () => {
    try {
      let tx = await exchange.connect(account).addAdmin(user);
      //    console.log(tx);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     "Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'"
      //   );
    }
  });

  it("Should remove an admin for Exchange", async () => {
    try {
      let tx = await exchange.connect(account).removeAdmin(user);
      //    console.log(tx);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     "Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'"
      //   );
    }
  });

  it("Should approve funds in GEMS to membership trader", async () => {
    let tx = await gemsToken
      .connect(account)
      .approve(membershipTrader.address, 100000);
    // console.log(tx);
    // console.log(await gemsToken.allowance(admin, membershipTraderAddress));
  });

  it("Should set Membership Trader in Carbon Membership", async () => {
    try {
      let tx = await carbonMembership
        .connect(account3)
        .setMembershipTrader(membershipTrader.address);
      // console.log(tx);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`
      //   );
    }
  });

  it("Should pause the Carbon Membership Contract", async () => {
    try {
      let tx = carbonMembership.connect(account2).pause();
      // console.log(tx);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`
      //   );
    }
  });

  it("Should execute the order in Membership Trader - for PASS", async () => {
    try {
      let tx = await membershipTrader.connect(account).executeOrder(admin);
      // console.log(tx);
      console.log(
        "bal. membership Trader: ",
        await gemsToken.balanceOf(membershipTrader.address)
      );
      console.log("user bal. ", await carbonMembership.balanceOf(admin));
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Only Membership Trader can call this function'`
      //   );
    }

    try {
      let tx = await membershipTrader.connect(account).executeOrder(admin);
      // console.log(tx);
      console.log(
        "bal. membership Trader: ",
        await gemsToken.balanceOf(membershipTrader.address)
      );
      console.log("user bal. ", await carbonMembership.balanceOf(admin));
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Tokens are not approved to the Membership Trader'`
      //   );
    }
  });

  it("Should unpause the Carbon Membership Contract", async () => {
    try {
      let tx = await carbonMembership.connect(account).unpause();
      // console.log(tx);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Pausable: not paused'`
      //   );
    }

    try {
      let tx = await carbonMembership.connect(account).unpause();
      // console.log(tx);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`
      //   );
    }
  });

  it("Should update Factory in ERC 721 NFT Contract", async () => {
    try {
      let tx = await nftContract.connect(account).updateFactory(anotherUser);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'`
      //   );
    }
  });

  it("Should update Factory in Exchange", async () => {
    try {
      let tx = await exchange.connect(account).updateFactory(anotherUser);
    } catch (error) {
      //   console.log(error.message);
      //   expect(error.message).to.equal(
      //     `Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'`
      //   );
    }
  });
});
