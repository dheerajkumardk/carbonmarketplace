
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

// ABIs
const GEMSTOKENABI = require("./../artifacts/contracts/Staking/GEMSToken.sol/GEMSToken.json");
const CARBONMEMBERSHIPABI = require("./../artifacts/contracts/Membership/CarbonMembership.sol/CarbonMembership.json");
const MEMBERSHIPTRADERABI = require("./../artifacts/contracts/Membership/MembershipTrader.sol/MembershipTrader.json");

let gemsToken; // GEMS_TOKEN
let carbonMembership; // CARBON_MEMBERSHIP_PASS
let membershipTrader; // MEMBERSHIP_TRADER

let gemsTokenAddress = '0x7969c5eD335650692Bc04293B07F5BF2e7A673C0';
let carbonMembershipAddress = '0xFD471836031dc5108809D173A067e8486B9047A3';
let membershipTraderAddress = '0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc';

let account, account2;
let provider = ethers.getDefaultProvider("http://localhost:8545");

gemsToken = new ethers.Contract(gemsTokenAddress, GEMSTOKENABI.abi, provider);
carbonMembership = new ethers.Contract(carbonMembershipAddress, CARBONMEMBERSHIPABI.abi, provider);
membershipTrader = new ethers.Contract(membershipTraderAddress, MEMBERSHIPTRADERABI.abi, provider);

describe("Membership Test", () => {

    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();
    })

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
// Mint NFT
// Pause the function
// unpause the function
// Change owner
// Execute order
// Redeem GEMS