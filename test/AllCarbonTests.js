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
let amount = "100000"; // STAKING_AMOUNT
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

describe("All Carbon Tests", () => {



    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();
        admin = account.address;
    })

    it('Should be able to change Exchange Address in Minting Factory', async () => {
        let changeAddress = await mintingFactory.connect(account).updateExchangeAddress(exchangeAddress);
        await changeAddress.wait();

        mintingFactory.on("ExchangeAddressChanged", (_oldAddress, _newAddress) => {
            newExchangeAddress = _newAddress;
            console.log(_oldAddress, _newAddress);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("New Exchange Address: ", newExchangeAddress);
    })

    it('Should mint NFT contract in Minting Factory', async () => {
        let tx = await mintingFactory.connect(account).createCollection("Royal Challengers Bangalore", "RCB", account.address, 100);

        mintingFactory.on("NFTContractCreated", (_name, _symbol, _nftContract, _tokenId) => {
            nftContractAddress = _nftContract;
            console.log(_name, _symbol, _nftContract, _tokenId);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);

        console.log("NFT Contract Address: ", nftContractAddress);
    })

    it('Minting Factory set approval for Exchange Contract', async () => {
        nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);
        nftContractAdmin = await nftContract.admin();

        let tx = await nftContract.connect(account).setApprovalForAll(exchangeAddress, true);
        // console.log(tx);
    })

    it('Check set Approval of Minting Factory minted contracts to Exchange', async () => {
        // nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);
        // nftContractAdmin = await nftContract.getContractAdmin();

        let tx = await nftContract.isApprovedForAll(nftContractAdmin, exchangeAddress);
        console.log(tx);
    })

    it('Should return NFT contract created by the user', async () => {
        console.log(mintingFactory.getNFTsForOwner(account));
    })

    it('Should mint an NFT for a contract using Minting Factory', async () => {
        let newNFT = await mintingFactory.connect(account).mintNFT(nftContractAddress);

        let tokenIdMinted;
        mintingFactory.on("NFTMinted", (_nftContract, _tokenId) => {
            tokenIdMinted = _tokenId;
            console.log(_nftContract, _tokenId.toString());
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("TokenID Minted #: ", tokenIdMinted.toString());
    })

    it('Should return totalNFTs minted for a contract', async () => {
        let totalNFTs = await mintingFactory.getTotalNFTsMinted(nftContractAddress);

        console.log(totalNFTs.toString());
    })

    it('Should return total NFT contract minted by a user', async () => {
        let totalCollections = await mintingFactory.getNFTsForOwner(account.address);
        console.log("total collections: ", totalCollections.toString());
    })

    // it ('Should check current admin of Minting Factory', async () => {
    //     let tx = await mintingFactory.isAdmin(account.address);
    //     console.log(tx);
    // })

    it('Should add admin role to another address in Minting Factory', async () => {
        let tx = await mintingFactory.connect(account).addAdmin(account2.address);
        // console.log(tx);
    })

    // it ('Should leave admin role of Minting Factory', async () => {
    //     let tx = await mintingFactory.connect(account).leaveRole();
    //     console.log(tx);
    // })

    it('Should remove admin role for another address in Minting Factory', async () => {
        let tx = await mintingFactory.connect(account).removeAdmin(account2.address);
        // console.log(tx);
    })
})

describe("Staking", () => {

    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();
        admin = account.address;
    })

    it('Should update staking pool in GEMS NFT Receipt Contract', async () => {
        let tx = await gemsNFTReceipt.connect(account).setStakingPool(gemsStaking.address);
    })

    it('Approve user GEMS tokens to Staking contract', async () => {
        let userBalance = await gemsToken.balanceOf(account.address);
        // console.log("user bal", userBalance.toString());

        let tx = await gemsToken.connect(account).approve(gemsStakingAddress, ethers.utils.parseEther(amount));
        // console.log(tx);
    })

    it('Should call stake function in GEMS Staking Contract', async () => {
        let staketxn = await gemsStaking.connect(account).stake(account.address, ethers.utils.parseEther(amount));

        let user, amountStaked;
        gemsStaking.on("Staked", (_user, _amount) => {
            user = _user;
            amountStaked = _amount;
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log(user, " has staked ", amountStaked.toString(), " tokens.");
    })

    it('Should call unstake function in GEMS Staking Contract', async () => {
        let unstakeTxn = await gemsStaking.connect(account).unstake();

        let user, amount;
        gemsStaking.on("UnStaked", (_user, _amount) => {
            user = _user;
            amount = _amount;
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log(user, " has unstaken ", amount.toString(), " tokens.");
    })
    // it('Approve user GEMS tokens to Staking contract', async () => {
    //     let userBalance = await gemsToken.balanceOf(account.address);
    //     // console.log("user bal", userBalance.toString());

    //     let tx = await gemsToken.connect(account).approve(gemsStakingAddress, ethers.utils.parseEther(amount));
    //     // console.log(tx);
    // })
    // it('Should call stake function in GEMS Staking Contract', async () => {
    //     let staketxn = await gemsStaking.connect(account).stake(account.address, ethers.utils.parseEther(amount));

    //     let user, amountStaked;
    //     gemsStaking.on("Staked", (_user, _amount) => {
    //         user = _user;
    //         amountStaked = _amount;
    //     });
    //     await new Promise(res => setTimeout(() => res(null), 5000));

    //     console.log(user, " has staked ", amountStaked.toString(), " tokens.");
    // })
    it('Should verify NFT burning in GEMS NFT Receipt', async () => {
        // let txn = await gemsNFTReceipt.ownerOf(tokenId);
        // console.log(txn);

        let txn2 = await gemsToken.balanceOf(account.address);
        console.log(txn2.toString());
    })

})

describe("Exchange", () => {

    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();
        admin = account.address;
    })

    it('Should Approve some ETH tokens for Buy Order to Exchange', async () => {
        let allowanceAmt = "1000000000000000000"; // 1 ETH
        // approves amount tokens
        let tx = await eth.connect(account).approve(exchangeAddress, ethers.utils.parseEther(allowanceAmt));
    })

    it('Should Approve nft with given tokenId for Sell Order', async () => {
        // approves the nft with given token id
        let tx = await nftContract.connect(account).getApproved(101);
        // console.log(tx);
    })

    it('Should Validate the NFT sale in Exchange', async () => {
        // check token allowance
        let allowanceAmt = await eth.allowance(account.address, exchangeAddress);
        console.log(allowanceAmt.toString());

        // check if user has x amt of token balance
        let userBalance = await eth.balanceOf(account.address);

        // check nft allowance
        let allowanceNFT = await nftContract.getApproved(101);
        // console.log(allowanceNFT);

        // check auction time

    })

    it('Should pause the Exchange contract', async () => {
        let tx = await exchange.connect(account).pause();
        // console.log(tx);
    })

    it('Should unpause the Exchange contract', async () => {
        let tx = await exchange.connect(account).unpause();
        // console.log(tx);
    })

    it('Should add an admin for Exchange', async () => {
        let tx = await exchange.connect(account).addAdmin(account2.address);
        //    console.log(tx);
    })

    it('Should leave admin role for Exchange', async () => {
        let tx = await exchange.connect(account2).leaveRole();
        //    console.log(tx);
    })

    it('Should remove an admin for Exchange', async () => {
        let tx = await exchange.connect(account).removeAdmin(account2.address);
        // console.log(tx); 
    })
})

describe("Membership", () => {

    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();
        admin = account.address;
    })

    it('Should approve funds in GEMS to membership trader', async () => {
        let tx = await gemsToken.connect(account).approve(membershipTraderAddress, 100000);
        // console.log(tx);
        console.log((await gemsToken.allowance(account.address, membershipTraderAddress)).toString());
    })

    it('Should set Membership Trader in Carbon Membership', async () => {
        let tx = await carbonMembership.connect(account).setMembershipTrader(membershipTraderAddress);
        // console.log(tx);
    })
    it('Should set Carbon Fee Vault - Membership Trader', async () => {
        let tx = await membershipTrader.connect(account).setCarbonFeeVault(account2.address);
    })

    // it('Should pause the Carbon Membership Contract', async () => {
    //     let tx = carbonMembership.connect(account).pause();
    //     // console.log(tx);
    // })

    it('Should unpause the Carbon Membership Contract', async () => {
        let tx = carbonMembership.connect(account).unpause();
        // console.log(tx);
    })

    it('Should execute the order in Membership Trader for PASS', async () => {
        let tx = await membershipTrader.connect(account).executeOrder(account.address);
        // console.log(tx);
        console.log("bal. membership Trader: ", (await gemsToken.balanceOf(membershipTraderAddress)).toString());
        console.log("user bal. ", (await carbonMembership.balanceOf(account.address)).toString());
    })

    it('Should update owner for Carbon Membership', async () => {
        let tx = carbonMembership.connect(account).updateOwner(account2.address)
    })

    it('Should update owner for Membership Trader', async () => {
        let tx = membershipTrader.connect(account).updateOwner(account2.address)
    })
})
