
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
const NFTCONTRACTABI = require("./../artifacts/contracts/MintingAndStorage/ERC721NFTContract.sol/ERC721NFTContract.json");
const CARBONMEMBERSHIPABI = require("./../artifacts/contracts/Membership/CarbonMembership.sol/CarbonMembership.json");
const MEMBERSHIPTRADERABI = require("./../artifacts/contracts/Membership/MembershipTrader.sol/MembershipTrader.json");

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

describe("All Carbon Tests Handled", () => {

    beforeEach(async () => {
        [account, account2, account3] = await ethers.getSigners();
        admin = account.address;
    })

    it('Should add an admin for Minting Factory', async () => {
        try {
            let tx = await mintingFactory.connect(account).addAdmin(account2.address);
            //    console.log(tx);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'");
        }
    })

    it('Should remove an admin for Minting Factory', async () => {
        try {
            let tx = await mintingFactory.connect(account).removeAdmin(account2.address);
            //    console.log(tx);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'");
        }

    })

    // Getting this on second try => After owner is changed
    it('Should be able to change Exchange Address for Minting Factory', async () => {

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
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Only Admin can call this!'");
        }


    })

    it('Should update owner for Carbon Membership', async () => {
        try {
            let tx = carbonMembership.connect(account).updateOwner(account2.address)

        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`);
        }
    })

    it('Should update owner for Membership Trader', async () => {
        try {

            let tx = membershipTrader.connect(account).updateOwner(account2.address)
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`);
        }
    })

    it('Should mint NFT contract in Minting Factory', async () => {

        try {
            let tx = await mintingFactory.connect(account).createNFTContract("Royal Challengers Bangalore", "RCB", account.address);

            mintingFactory.on("NFTContractCreated", (_name, _symbol, _nftContract) => {
                nftContractAddress = _nftContract;
                console.log(_name, _symbol, _nftContract);
            });
            await new Promise(res => setTimeout(() => res(null), 5000));

            nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);

            console.log("NFT Contract Address: ", nftContractAddress);

        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Only Admin can call this!'");

        }

    })

    it('Should mint an NFT for a contract in Minting Factory', async () => {
        try {
            let newNFT = await mintingFactory.connect(account).mintNFT(nftContractAddress);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`invalid address or ENS name (argument="name", value=undefined, code=INVALID_ARGUMENT, version=contracts/5.5.0)`);
        }
        try {
            let tokenIdMinted;
            mintingFactory.on("NFTMinted", (_nftContract, _tokenId) => {
                tokenIdMinted = _tokenId;
                console.log(_nftContract, _tokenId);
            });
            await new Promise(res => setTimeout(() => res(null), 5000));
            // console.log("TokenID Minted #: ", tokenIdMinted.toString());

        } catch (error) {

            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Only Creator or Admin can call this!'`);
        }

    })

    it('Should return totalNFTs minted for a contract', async () => {
        try {

            let totalNFTs = await mintingFactory.getTotalNFTsMinted(nftContractAddress);
            console.log(totalNFTs.toString());
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`invalid address or ENS name (argument="name", value=undefined, code=INVALID_ARGUMENT, version=contracts/5.5.0)`);
        }
    })

    it('Should return total NFT contract minted by a user', async () => {
        try {
            let totalCollections = await mintingFactory.getNFTsForOwner(account);
            console.log("total collections: ", totalCollections.toString());
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`invalid address or ENS name (argument="name", value="<SignerWithAddress 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266>", code=INVALID_ARGUMENT, version=contracts/5.5.0)`);
        }
    })

    it('Should update staking pool in GEMS NFT Receipt', async () => {
        try {

            let tx = await gemsNFTReceipt.connect(account2).setStakingPool(gemsStaking.address);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Only Staking pool contract or admin can call this function'");
        }
    })

    it('Approve user GEMS tokens to Staking contract', async () => {
        let userBalance = await gemsToken.balanceOf(account.address);

        let tx = await gemsToken.connect(account).approve(gemsStakingAddress, ethers.utils.parseEther(amount));
    })

    it('Should call stake function in GEMS STaking', async () => {

        try {
            let staketxn = await gemsStaking.connect(account2).stake(account.address, amount);

            let user, amountStaked;
            gemsStaking.on("Staked", (_user, _amount) => {
                user = _user;
                amountStaked = _amount;
            });
            await new Promise(res => setTimeout(() => res(null), 5000));

            console.log(user, " has staked ", amountStaked.toString(), " tokens.");
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Only Staking pool contract or admin can call this function'");
        }

        try {
            let staketxn = await gemsStaking.connect(account2).stake(account.address, amount);

            let user, amountStaked;
            gemsStaking.on("Staked", (_user, _amount) => {
                user = _user;
                amountStaked = _amount;
            });
            await new Promise(res => setTimeout(() => res(null), 5000));

            console.log(user, " has staked ", amountStaked.toString(), " tokens.");
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'User had already staked tokens'");
        }

        try {
            let staketxn = await gemsStaking.connect(account2).stake(account.address, amount);

            let user, amountStaked;
            gemsStaking.on("Staked", (_user, _amount) => {
                user = _user;
                amountStaked = _amount;
            });
            await new Promise(res => setTimeout(() => res(null), 5000));

            console.log(user, " has staked ", amountStaked.toString(), " tokens.");
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Inadequate token allowance'");
        }

        try {
            let staketxn = await gemsStaking.connect(account2).stake(account.address, amount);

            let user, amountStaked;
            gemsStaking.on("Staked", (_user, _amount) => {
                user = _user;
                amountStaked = _amount;
            });
            await new Promise(res => setTimeout(() => res(null), 5000));

            console.log(user, " has staked ", amountStaked.toString(), " tokens.");
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'User address is zero'");
        }

        try {
            let staketxn = await gemsStaking.connect(account2).stake(account.address, amount);

            let user, amountStaked;
            gemsStaking.on("Staked", (_user, _amount) => {
                user = _user;
                amountStaked = _amount;
            });
            await new Promise(res => setTimeout(() => res(null), 5000));

            console.log(user, " has staked ", amountStaked.toString(), " tokens.");
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Requires exactly 100,000 tokens for staking'");
        }



    })

    it('Should call unstake function in GEMS STaking', async () => {
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
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'User had no amount staked!'");
        }

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
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'ERC721: owner query for nonexistent token'");
        }


    })

    it('Should verify GEMS NFT burning', async () => {
        // let txn = await gemsNFTReceipt.ownerOf(tokenId);
        // console.log(txn);

        let txn2 = await gemsToken.balanceOf(account.address);
        // console.log(txn2.toString());
    })

    it('Should Approve some ETH tokens for Buy Order to Exchange', async () => {
        let allowanceAmt = "1000000000000000000"; // 1 ETH
        // approves amount tokens
        let tx = await eth.connect(account).approve(exchangeAddress, ethers.utils.parseEther(allowanceAmt));
    })

    it('Should Approve nft with given tokenId for Sell Order', async () => {
        // approves the nft with given token id
        let tx = await nftContract.connect(account).getApproved(tokenId);
        // console.log(tx);

    })

    it('Should Validate the NFT sale for Exchange Order', async () => {
        // check token allowance
        let allowanceAmt = await eth.allowance(account.address, exchangeAddress);
        // console.log(allowanceAmt.toString());

        // check if user has x amt of token balance
        let userBalance = await eth.balanceOf(account.address);

        // check nft allowance
        let allowanceNFT = await nftContract.getApproved(tokenId);

    })

    it('Should execute the order in Exchange', async () => {
        let auctionTime = 1647728701;
        let allowanceAmt = "1000000000000000000";

        try {
            let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime, 0);
            // for primary market, seller => minting factory
            // console.log(executeOrder);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'`);
        }

        try {
            let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime, 0);

        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Pausable: paused'`);
        }

        try {
            let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime, 0);

        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Contract is not approved for this NFT'`);
        }

        try {
            let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime, 0);

        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Seller does not owns the token'`);
        }

        try {
            let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime, 0);

        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string "Allowance is less than the NFT's price."`);
        }

        try {
            let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime, 0);

        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Buyer doesn't have sufficient funds'`);
        }

        try {
            let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime, 0);

        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Auction has ended'`);
        }

        try {
            let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime, 0);

        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Order is cancelled'`);
        }

        try {
            let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime, 0);
            // for primary market, seller => minting factory
            // console.log(executeOrder);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'ERC721 Factory doesn't match with Exchange Factory'`);
        }

        try {
            let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, allowanceAmt, auctionTime, 0);
            // for primary market, seller => minting factory
            // console.log(executeOrder);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Invalid mode specified'`);
        }
    })

    it('Should cancel the order in Exchange', async () => {

        try {

            let cancelOrder = await exchange.connect(account).cancelOrder(nftContractAddress, tokenId, account.address);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`invalid address or ENS name (argument="name", value=undefined, code=INVALID_ARGUMENT, version=contracts/5.5.0)`);
        }

        try {
            let cancelOrder = await exchange.connect(account).cancelOrder(nftContractAddress, tokenId, account.address);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Pausable: paused'`);
        }

        try {
            let cancelOrder = await exchange.connect(account).cancelOrder(nftContractAddress, tokenId, account.address);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'`);
        }

        try {
            let cancelOrder = await exchange.connect(account).cancelOrder(nftContractAddress, tokenId, account.address);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Order already cancelled'`);
        }

    })

    it('Should uncancel the order in Exchange', async () => {

        try {
            let uncancelOrder = await exchange.connect(account).uncancelOrder(nftContractAddress, tokenId, account.address);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Pausable: paused'`);
        }

        try {
            let uncancelOrder = await exchange.connect(account).uncancelOrder(nftContractAddress, tokenId, account.address);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'`);
        }

        try {
            let uncancelOrder = await exchange.connect(account).uncancelOrder(nftContractAddress, tokenId, account.address);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(` Error: VM Exception while processing transaction: reverted with reason string 'Order was never cancelled'`);
        }
    })

    it('Should withdraw fees collected from the Exchange', async () => {
        try {

            // tradingFee = await WETH.balanceOf(exchangeAddress);
            let tx = await exchange.connect(account).redeemTotalFeesCollected();
            // console.log(tx);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'");
        }

        try {

            // tradingFee = await WETH.balanceOf(exchangeAddress);
            let tx = await exchange.connect(account).redeemTotalFeesCollected();
            // console.log(tx);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Pausable: paused'`);
        }
    })

    it('Should set the carbon fee vault address in Exchange', async () => {
        try {

            // tradingFee = await WETH.balanceOf(exchangeAddress);
            let tx = await exchange.connect(account).setCarbonFeeVaultAddress(account2.address);
            // console.log(tx);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'");
        }

    })

    it('Should add an admin for Exchange', async () => {
        try {
            let tx = await exchange.connect(account).addAdmin(account2.address);
            //    console.log(tx);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'");
        }
    })

    it('Should remove an admin for Exchange', async () => {
        try {
            let tx = await exchange.connect(account).removeAdmin(account2.address);
            //    console.log(tx);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal("Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'");
        }

    })

    it('Should approve funds in GEMS to membership trader', async () => {
        let tx = await gemsToken.connect(account).approve(membershipTraderAddress, 100000);
        // console.log(tx);
        // console.log(await gemsToken.allowance(account.address, membershipTraderAddress));
    })

    it('Should set Membership Trader in Carbon Membership', async () => {
        try {

            let tx = await carbonMembership.connect(account3).setMembershipTrader(membershipTraderAddress);
            // console.log(tx);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`);
        }
    })

    it('Should pause the Carbon Membership Contract', async () => {
        try {
            let tx = carbonMembership.connect(account2).pause();
            // console.log(tx);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`);
        }

    })

    it('Should execute the order in Membership Trader - for PASS', async () => {
        try {
            let tx = await membershipTrader.connect(account).executeOrder(account.address);
            // console.log(tx);
            console.log("bal. membership Trader: ", await gemsToken.balanceOf(membershipTraderAddress));
            console.log("user bal. ", await carbonMembership.balanceOf(account.address));
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Only Membership Trader can call this function'`);
        }

        try {
            let tx = await membershipTrader.connect(account).executeOrder(account.address);
            // console.log(tx);
            console.log("bal. membership Trader: ", await gemsToken.balanceOf(membershipTraderAddress));
            console.log("user bal. ", await carbonMembership.balanceOf(account.address));
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Tokens are not approved to the Membership Trader'`);
        }
    })

    it('Should redeem GEMS from Membership Trader Contract', async () => {
        try {
            let tx = await membershipTrader.connect(account3).withdrawGEMS();
            console.log(await gemsToken.balanceOf(membershipTraderAddress));
            console.log(await gemsToken.balanceOf(account.address));
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`);
        }

    })

    it('Should unpause the Carbon Membership Contract', async () => {


        try {
            let tx = await carbonMembership.connect(account).unpause();
            // console.log(tx);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Pausable: not paused'`);
        }

        try {
            let tx = await carbonMembership.connect(account).unpause();
            // console.log(tx);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`);
        }
    })

    it('Should update Factory in ERC 721 NFT Contract', async () => {
        try {
            let tx = await nftContract.connect(account).updateFactory(account3.address);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'`);
        }

    })

    it('Should update Factory in Exchange', async () => {
        try {
            let tx = await exchange.connect(account).updateFactory(account3.address);
        } catch (error) {
            console.log(error.message);
            expect(error.message).to.equal(`Error: VM Exception while processing transaction: reverted with reason string 'Restricted to admin.'`);
        }

    })

})
