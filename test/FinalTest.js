const Address = require("./Addresses.json");

const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

// ABIs
const MintingFactoryABI = require('./../artifacts/contracts/MintingAndStorage/MintingFactory.sol/MintingFactory.json');
const ETHTOKENABI = require("./../artifacts/contracts/ETHToken.sol/ETHToken.json");
const EXCHANGEABI = require("./../artifacts/contracts/Exchange/ExchangeCore.sol//ExchangeCore.json");
const GEMSTOKENABI = require("./../artifacts/contracts/Staking/GEMSToken.sol/GEMSToken.json");
const GEMSNFTRECEIPTABI = require("./../artifacts/contracts/Staking/GEMSNFTReceipt.sol/GEMSNFTReceipt.json");
const GEMSSTAKINGABI = require("./../artifacts/contracts/Staking/GEMSStaking.sol/GEMSStaking.json");
const CARBONMEMBERSHIPABI = require("./../artifacts/contracts/Membership/CarbonMembership.sol/CarbonMembership.json");
const MEMBERSHIPTRADERABI = require("./../artifacts/contracts/Membership/MembershipTrader.sol/MembershipTrader.json");
const NFTCONTRACTABI = require("./../artifacts/contracts/MintingAndStorage/ERC721NFTContract.sol/ERC721NFTContract.json");

let nftContract; // NFT_CONTRACT
let newAdmin; // owner of Minting Factory

let stakingPool;
let amount = "100000000000000000000000"; // STAKING_AMOUNT
let tokenId = 1;

let ethAddress = Address.ethAddress;
let mintingFactoryAddress = Address.mintingFactoryAddress;
let exchangeAddress = Address.exchangeAddress;
let gemsTokenAddress = Address.gemsTokenAddress;
let gemsNFTReceiptAddress = Address.gemsNFTReceiptAddress;
let gemsStakingAddress = Address.gemsStakingAddress;
let carbonMembershipAddress = Address.carbonMembershipAddress;
let membershipTraderAddress = Address.membershipTraderAddress;
let nftContractAddress;
 
let account, account2;
let newExchangeAddress;
let provider = ethers.getDefaultProvider("http://localhost:8545");

let nftContractAdmin;

let mintingFactory = new ethers.Contract(mintingFactoryAddress, MintingFactoryABI.abi, provider);
let eth = new ethers.Contract(ethAddress, ETHTOKENABI.abi, provider);
let exchange = new ethers.Contract(exchangeAddress, EXCHANGEABI.abi, provider);
let gemsToken = new ethers.Contract(gemsTokenAddress, GEMSTOKENABI.abi, provider);
let gemsNFTReceipt = new ethers.Contract(gemsNFTReceiptAddress, GEMSNFTRECEIPTABI.abi, provider);
let gemsStaking = new ethers.Contract(gemsStakingAddress, GEMSSTAKINGABI.abi, provider);
let carbonMembership = new ethers.Contract(carbonMembershipAddress, CARBONMEMBERSHIPABI.abi, provider);
let membershipTrader = new ethers.Contract(membershipTraderAddress, MEMBERSHIPTRADERABI.abi, provider);
describe("ERC721MintingFactory", () => {



    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();
        admin = account.address;
    })

    it('Should be able to change Exchange Address', async () => {
        let changeAddress = await mintingFactory.connect(account).updateExchangeAddress(exchangeAddress);
        await changeAddress.wait();

        mintingFactory.on("ExchangeAddressChanged", (_oldAddress, _newAddress) => {
            newExchangeAddress = _newAddress;
            console.log(_oldAddress, _newAddress);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("New Exchange Address: ", newExchangeAddress);
    })

    // WORKING
    it('Should mint NFT contract', async () => {
        let tx = await mintingFactory.connect(account).createNFTContract("Royal Challengers Bangalore", "RCB", account.address);

        mintingFactory.on("NFTContractCreated", (_name, _symbol, _nftContract) => {
            nftContractAddress = _nftContract;
            console.log(_name, _symbol, _nftContract);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);

        console.log("NFT Contract Address: ", nftContractAddress);
    })

    it('Set Approval', async () => {
        nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);
        nftContractAdmin = await nftContract.getContractAdmin();

        let tx = await nftContract.connect(account).setApprovalForAll(exchangeAddress, true);
        // console.log(tx);
    })

    it('Check set Approval', async () => {
        // nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);
        // nftContractAdmin = await nftContract.getContractAdmin();

        let tx = await nftContract.isApprovedForAll(nftContractAdmin, exchangeAddress);
        console.log(tx);
    })

    it('Should return NFT contract created by the user', async () => {
        console.log(mintingFactory.getNFTsForOwner(account));
    })

    it('Should mint an NFT for a contract', async () => {
        let newNFT = await mintingFactory.connect(account).mintNFT(nftContractAddress);

        let tokenIdMinted;
        mintingFactory.on("NFTMinted", (_nftContract, _tokenId) => {
            tokenIdMinted = _tokenId;
            console.log(_nftContract, _tokenId);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("TokenID Minted #: ", tokenIdMinted.toString());
    })

    // WORKING FINE
    it('Should return totalNFTs minted for a contract', async () => {
        let totalNFTs = await mintingFactory.getTotalNFTsMinted(nftContractAddress);

        console.log(totalNFTs.toString());
    })

    // WORKING => But gives undefined
    it('Should return total NFT contract minted by a user', async () => {
        let totalCollections = await mintingFactory.getNFTsForOwner(account.address);
        console.log("total collections: ", totalCollections.toString());
    })


    // // ERROR => Only Exchange can call it, Done that


    // it('Should change the owner', async () => {
    //     let tx = await mintingFactory.connect(account).changeAdmin(account2.address);
    //     // console.log(tx);
    //     mintingFactory.on("AdminUpdated", (_newAdmin) => {
    //         newAdmin = _newAdmin;
    //     });
    //     await new Promise(res => setTimeout(() => res(null), 5000));
    //     console.log("New Admin Address: ", newAdmin);
    // })

    // #############################################################################

    it('Should update staking pool', async () => {
        let tx = await gemsNFTReceipt.connect(account).setStakingPool(gemsStaking.address);
    })

    // // STAKING TESTS

    it('Approve user tokens to Staking contract', async () => {
        let userBalance = await gemsToken.balanceOf(account.address);
        // console.log("user bal", userBalance.toString());

        let tx = await gemsToken.connect(account).approve(gemsStakingAddress, ethers.utils.parseEther(amount));
        // console.log(tx);
    })

    it('Should call stake function', async () => {
        let staketxn = await gemsStaking.connect(account).stake(account.address, amount);

        let user, amountStaked;
        gemsStaking.on("Staked", (_user, _amount) => {
            user = _user;
            amountStaked = _amount;
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log(user, " has staked ", amountStaked.toString(), " tokens.");
    })

    it('Should call unstake function', async () => {
        let unstakeTxn = await gemsStaking.connect(account).unstake();

        let user, amount;
        gemsStaking.on("UnStaked", (_user, _amount) => {
            user = _user;
            amount = _amount;
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log(user, " has unstaken ", amount.toString(), " tokens.");
    })

    it('Should verify NFT burning', async () => {
        // let txn = await gemsNFTReceipt.ownerOf(tokenId);
        // console.log(txn);

        let txn2 = await gemsToken.balanceOf(account.address);
        console.log(txn2.toString());
    })



    // #################################################
    // EXCHANGE TESTS

    it('Should Approve x tokens for Buy Order', async () => {
        let allowanceAmt = "1000000000000000000"; // 1 ETH
        // approves amount tokens
        let tx = await eth.connect(account).approve(exchangeAddress, ethers.utils.parseEther(allowanceAmt));
    })

    it('Should Approve nft with given tokenId for Sell Order', async () => {
        // approves the nft with given token id
        let tx = await nftContract.connect(account).getApproved(tokenId);
        // console.log(tx);
    })

    it('Should Validate the NFT sale', async () => {
        // check token allowance
        let allowanceAmt = await eth.allowance(account.address, exchangeAddress);
        console.log(allowanceAmt.toString());

        // check if user has x amt of token balance
        let userBalance = await eth.balanceOf(account.address);

        // check nft allowance
        let allowanceNFT = await nftContract.getApproved(tokenId);
        // console.log(allowanceNFT);

        // check auction time

    })

    it('Should execute the order', async () => {
        let auctionTime = 1647728701;
        let allowanceAmt = "1000000000000000000";

        let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime);
        // for primary market, seller => minting factory
        // console.log(executeOrder);
    })

    it('Should cancel the order', async () => {
        let cancelOrder = await exchange.connect(account).cancelOrder(nftContractAddress, tokenId, account.address);
        // console.log(cancelOrder);
    })

    it('Should transfer fees to the Exchange', async () => {
        // tradingFee = await WETH.balanceOf(exchangeAddress);
        let tx = await exchange.connect(account).RedeemTradingFees();
        // console.log(tx);
    })

    // it('Should change the owner', async () => {
    //     let tx = await exchange.connect(account).updateOwner(account2.address);
    //     console.log(tx);
    // })


    it('Should approve funds to membership trader', async () => {
        let tx = await gemsToken.connect(account).approve(membershipTraderAddress, 100000);
        // console.log(tx);
        console.log(await gemsToken.allowance(account.address, membershipTraderAddress));
    })

    it('Should set Membership Trader', async () => {
        let tx = await carbonMembership.connect(account).setMembershipTrader(membershipTraderAddress);
        // console.log(tx);
    })

    it('Should pause the Carbon Membership Contract', async () => {
        let tx = carbonMembership.connect(account).pause();
        // console.log(tx);
    })

    it('Should execute the order', async () => {
        let tx = await membershipTrader.connect(account).executeOrder(account.address);
        // console.log(tx);
        console.log("bal. membership Trader: ", await gemsToken.balanceOf(membershipTraderAddress));
        console.log("user bal. ", await carbonMembership.balanceOf(account.address));
    })

    it('Should redeem GEMS', async () => {
        let tx = await membershipTrader.connect(account).withdrawGEMS();
        console.log(await gemsToken.balanceOf(membershipTraderAddress));
        console.log(await gemsToken.balanceOf(account.address));
    })

    it('Should unpause the Carbon Membership Contract', async () => {
        let tx = carbonMembership.connect(account).unpause();
        console.log(tx);
    })

    it('Should update owner for Carbon Membership', async () => {
        let tx = carbonMembership.connect(account).updateOwner(account2.address)
    })

    it('Should update owner for Membership Trader', async () => {
        let tx = membershipTrader.connect(account).updateOwner(account2.address)
    })




})
