//v1 develop
const { ethers } = require("hardhat");
const { expect, assert } = require("chai");
const gemTokenAbi = require("../artifacts/contracts/Staking/GEMSToken.sol/GEMSToken.json");
const gemnftAbi = require("../artifacts/contracts/Staking/GEMSNFT.sol/GEMSNFT.json");
const gemStakingAbi = require("../artifacts/contracts/Staking/GEMSStaking.sol/GEMSStaking.json");


let account, account2, GEMSToken, GEMSNFT, GEMSStaking;
let amount = 100000 * 10 ** 18;
let tokenId = 1;

const stakingAddress = "0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650";
GEMSStaking = new ethers.Contract(stakingAddress, gemStakingAbi.abi, account);

describe("Staking", () => {

    let gemTokenAddress = '0x7969c5eD335650692Bc04293B07F5BF2e7A673C0';
    let gemNFTAddress = '0x33791c463B145298c575b4409d52c2BcF743BF67';


    let GEMSToken = new ethers.Contract(gemTokenAddress, gemTokenAbi.abi, account);
    let GEMSNFT = new ethers.Contract(gemNFTAddress, gemnftAbi.abi, account);

    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();

    })


    it('Approve user tokens to Staking contract', async () => {
        let approveGEM = await GEMSToken.allowance(stakingAddress, amount);
        console.log(approveGEM);
    })

    it('Should call stake function', async () => {
        let staketxn = await GEMSStaking.stake(account, amount);

        let user, amount;
        GEMSStaking.on("Staked", (_user, _amount) => {
            user = _user;
            amount = _amount;
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log(user, " has staked ", amount, " tokens.");
    })

    it('Should verify nft minting', async () => {
        let tx = await GEMSNFT.ownerOf(tokenId);
        console.log(tx);
    })

    it('Should call unstake function', async () => {
        let unstakeTxn = await GEMSStaking.unstake();

        let user, amount;
        GEMSStaking.on("UnStaked", (_user, _amount) => {
            user = _user;
            amount = _amount;
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log(user, " has unstaken ", amount, " tokens.");
    })

    it('Should verify NFT burning', async () => {
        let txn = await GEMSNFT.ownerOf(tokenId);
        console.log(txn);

        let txn2 = await GEMSToken.balanceOf(account);
        console.log(txn2);
    })



})

