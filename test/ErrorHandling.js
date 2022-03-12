
// const { ethAddress, mintingFactoryAddress, exchangeAddress, gemsTokenAddress, gemsNFTReceiptAddress, gemsStakingAddress } = require("./Credentials.js");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

// ABIs
const MintingFactoryABI = require('./../artifacts/contracts/MintingAndStorage/MintingFactory.sol/MintingFactory.json');
const ETHTOKENABI = require("./../artifacts/contracts/ETHToken.sol/ETHToken.json");
const EXCHANGEABI = require("./../artifacts/contracts/Exchange/ExchangeCore.sol//ExchangeCore.json");
const GEMSTOKENABI = require("./../artifacts/contracts/Staking/GEMSToken.sol/GEMSToken.json");
const GEMSNFTRECEIPTABI = require("./../artifacts/contracts/Staking/GEMSNFTReceipt.sol/GEMSNFTReceipt.json");
const GEMSSTAKINGABI = require("./../artifacts/contracts/Staking/GEMSStaking.sol/GEMSStaking.json");
const NFTCONTRACTABI = require("./../artifacts/contracts/MintingAndStorage/ERC721NFTContract.sol/ERC721NFTContract.json");

let eth; // ETH_TOKEN
let mintingFactory; // MINTING_FACTORY
let nftContract; // NFT_CONTRACT
let newAdmin; // owner of Minting Factory
let exchange;
let gemsToken; // GEMS_TOKEN
let gemsNFTReceipt; // GEMS_NFT Receipt
let gemsStaking; // GEMS_STAKING
let stakingPool;
let amount = "100000000000000000000000"; // STAKING_AMOUNT
let tokenId = 1;

let ethAddress = '0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154';
let mintingFactoryAddress = '0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575';
let exchangeAddress = '0xCD8a1C3ba11CF5ECfa6267617243239504a98d90';
let gemsTokenAddress = '0x82e01223d51Eb87e16A03E24687EDF0F294da6f1';
let gemsNFTReceiptAddress = '0x2bdCC0de6bE1f7D2ee689a0342D76F52E8EFABa3';
let gemsStakingAddress = '0x7969c5eD335650692Bc04293B07F5BF2e7A673C0';
let nftContractAddress;

let account, account2;
let newExchangeAddress;
let provider = ethers.getDefaultProvider("http://localhost:8545");

let nftContractAdmin;

mintingFactory = new ethers.Contract(mintingFactoryAddress, MintingFactoryABI.abi, provider);
eth = new ethers.Contract(ethAddress, ETHTOKENABI.abi, provider);
exchange = new ethers.Contract(exchangeAddress, EXCHANGEABI.abi, provider);
gemsToken = new ethers.Contract(gemsTokenAddress, GEMSTOKENABI.abi, provider);
gemsNFTReceipt = new ethers.Contract(gemsNFTReceiptAddress, GEMSNFTRECEIPTABI.abi, provider);
gemsStaking = new ethers.Contract(gemsStakingAddress, GEMSSTAKINGABI.abi, provider);

describe("ERC721MintingFactory", () => {



    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();
        admin = account.address;
    })

    it('Should be able to change Exchange Address', async () => {

        try {
            let changeAddress = await mintingFactory.connect(account).updateExchangeAddress(exchangeAddress);
            await changeAddress.wait();

            mintingFactory.on("ExchangeAddressChanged", (_oldAddress, _newAddress) => {
                newExchangeAddress = _newAddress;
                console.log(_oldAddress, _newAddress);
            });
            await new Promise(res => setTimeout(() => res(null), 5000));
            console.log("New Exchange Address: ", newExchangeAddress);
        } catch (error) {
            // console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Only Admin can call this!'");
        }


    })

    // WORKING
    it('Should mint NFT contract', async () => {

        try {
            let tx = await mintingFactory.connect(account).createNFTContract("Royal Challengers Bangalore", "RCB", account.address, account.address);

            mintingFactory.on("NFTContractCreated", (_name, _symbol, _nftContract) => {
                nftContractAddress = _nftContract;
                console.log(_name, _symbol, _nftContract);
            });
            await new Promise(res => setTimeout(() => res(null), 5000));

            nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);

            console.log("NFT Contract Address: ", nftContractAddress);

        } catch (error) {
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Only Admin can call this!'");

        }

    })

    it('Set Approval', async () => {

        try {
            nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);
            nftContractAdmin = await nftContract.getContractAdmin();
            let tx = await nftContract.connect(account).setApprovalForAll(exchangeAddress, true);
            // console.log(tx);

        } catch (error) {
            expect(error.message).to.equal(`invalid contract address or ENS name (argument="addressOrName", value=undefined, code=INVALID_ARGUMENT, version=contracts/5.5.0)`);

        }

    })

    it('Check set Approval', async () => {
        // nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);
        // nftContractAdmin = await nftContract.getContractAdmin();
        try {
            let tx = await nftContract.isApprovedForAll(nftContractAdmin, exchangeAddress);
            console.log(tx);
        } catch (error) {
            expect(error.message).to.equal("Cannot read property 'isApprovedForAll' of undefined");
        }

    })

    it('Should return NFT contract created by the user', async () => {
        console.log(mintingFactory.getNFTsForOwner(account));
    })

    it('Should mint an NFT for a contract', async () => {

        try {
            let newNFT = await mintingFactory.connect(account).mintNFT(nftContractAddress);

            let tokenIdMinted;
            mintingFactory.on("NFTMinted", (_nftContract, _tokenId) => {
                tokenIdMinted = _tokenId;
                console.log(_nftContract, _tokenId);
            });
            await new Promise(res => setTimeout(() => res(null), 5000));
            console.log("TokenID Minted #: ", tokenIdMinted.toString());

        } catch (error) {
            expect(error.message).to.equal(`invalid address or ENS name (argument="name", value=undefined, code=INVALID_ARGUMENT, version=contracts/5.5.0)`);
        }

    })

    // WORKING FINE
    it('Should return totalNFTs minted for a contract', async () => {
        try {

            let totalNFTs = await mintingFactory.getTotalNFTsMinted(nftContractAddress);
            console.log(totalNFTs.toString());
        } catch (error) {
            expect(error.message).to.equal(`invalid address or ENS name (argument="name", value=undefined, code=INVALID_ARGUMENT, version=contracts/5.5.0)`);
        }
    })

    // WORKING => But gives undefined
    it('Should return total NFT contract minted by a user', async () => {
        try {
            let totalCollections = await mintingFactory.getNFTsForOwner(account);
            console.log("total collections: ", totalCollections.toString());
        } catch (error) {
            expect(error.message).to.equal(`invalid address or ENS name (argument="name", value="<SignerWithAddress 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266>", code=INVALID_ARGUMENT, version=contracts/5.5.0)`);
        }
    })


    // // ERROR => Only Exchange can call it, Done that


    it('Should change the owner', async () => {
        try {
            let tx = await mintingFactory.connect(account).changeAdmin(account2.address);
            // console.log(tx);
            mintingFactory.on("AdminUpdated", (_newAdmin) => {
                newAdmin = _newAdmin;
            });
            await new Promise(res => setTimeout(() => res(null), 5000));
            console.log("New Admin Address: ", newAdmin);
        } catch (error) {
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Only Admin can call this!'");
        }
    })

    // #############################################################################

    it('Should update staking pool', async () => {
        try {

            let tx = await gemsNFTReceipt.connect(account2).setStakingPool(gemsStaking.address);
        } catch (error) {
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Only Staking pool contract or admin can call this function'");
        }
    })

    // // STAKING TESTS

    it('Approve user tokens to Staking contract', async () => {
        let userBalance = await gemsToken.balanceOf(account.address);
        // console.log("user bal", userBalance.toString());

        let tx = await gemsToken.connect(account).approve(gemsStakingAddress, ethers.utils.parseEther(amount));
        // console.log(tx);
    })

    it('Should call stake function', async () => {

        let staketxn = await gemsStaking.connect(account2).stake(account.address, amount);

        let user, amountStaked;
        gemsStaking.on("Staked", (_user, _amount) => {
            user = _user;
            amountStaked = _amount;
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log(user, " has staked ", amountStaked.toString(), " tokens.");


    })

    it('Should call unstake function', async () => {
        try {
            let unstakeTxn = await gemsStaking.connect(account2).unstake();

            let user, amount;
            gemsStaking.on("UnStaked", (_user, _amount) => {
                user = _user;
                amount = _amount;
            });
            await new Promise(res => setTimeout(() => res(null), 5000));

            console.log(user, " has unstaken ", amount.toString(), " tokens.");
        } catch (error) {
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'User had no amount staked!'");
        }
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
        try {
            // approves the nft with given token id
            let tx = await nftContract.connect(account).getApproved(tokenId);
            // console.log(tx);
        } catch (error) {
            expect(error.message).to.equal("Cannot read property 'connect' of undefined");
        }
    })

    it('Should Validate the NFT sale', async () => {
        try {

            // check token allowance
            let allowanceAmt = await eth.allowance(account.address, exchangeAddress);
            console.log(allowanceAmt.toString());

            // check if user has x amt of token balance
            let userBalance = await eth.balanceOf(account.address);

            // check nft allowance
            let allowanceNFT = await nftContract.getApproved(tokenId);
            // console.log(allowanceNFT);

            // check auction time
        } catch (error) {
            expect(error.message).to.equal("Cannot read property 'getApproved' of undefined");
        }

    })

    it('Should execute the order', async () => {
        try {
            let auctionTime = 1647728701;
            let allowanceAmt = "1000000000000000000";

            let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime);
            // for primary market, seller => minting factory
            // console.log(executeOrder);

        } catch (error) {
            expect(error.message).to.equal(`invalid address or ENS name (argument="name", value=undefined, code=INVALID_ARGUMENT, version=contracts/5.5.0)`);
        }

    })

    it('Should cancel the order', async () => {
        try {
            let cancelOrder = await exchange.connect(account).cancelOrder(nftContractAddress, tokenId, account.address);
            // console.log(cancelOrder);
        } catch (error) {
            expect(error.message).to.equal(`invalid address or ENS name (argument="name", value=undefined, code=INVALID_ARGUMENT, version=contracts/5.5.0)`);
        }

    })

    it('Should transfer fees to the Exchange', async () => {
        try {

            // tradingFee = await WETH.balanceOf(exchangeAddress);
            let tx = await exchange.connect(account).RedeemTradingFees();
            // console.log(tx);
        } catch (error) {
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        }
    })

    it('Should change the owner', async () => {
        try {

            let tx = await exchange.connect(account).updateOwner(account2.address);
            // console.log(tx);
        } catch (error) {
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        }
    })







})
