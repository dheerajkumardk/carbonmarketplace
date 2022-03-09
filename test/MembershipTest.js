
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

// ABIs
const GEMSTOKENABI = require("");
const CARBONMEMBERSHIPABI = require("");
const MEMBERSHIPTRADERABI = require("");

let gemsToken; // GEMS_TOKEN
let carbonMembership; // CARBON_MEMBERSHIP_PASS
let membershipTrader; // MEMBERSHIP_TRADER

let gemsTokenAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
let carbonMembershipAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
let membershipTraderAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';

let account, account2;
let provider = ethers.getDefaultProvider("http://localhost:8545");

gemsToken = new ethers.Contract(gemsTokenAddress, GEMSTOKENABI.abi, provider);
carbonMembership = new ethers.Contract(carbonMembershipAddress, CARBONMEMBERSHIPABI.abi, provider);
membershipTrader = new ethers.Contract(membershipTraderAddress, MEMBERSHIPTRADERABI.abi, provider);

describe("Membership Test",  () => {
    
    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();
    })

    it('Should be able to change Exchange Address', async () => {
    })

})
