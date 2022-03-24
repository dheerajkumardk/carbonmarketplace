//v1 develop
const { ethers } = require("hardhat");

const ADMINABI = require("../artifacts/contracts/AdminRole.sol/AdminRole.json");

let account, account2;
let adminRoleAddress = '0xe14058B1c3def306e2cb37535647A04De03Db092';
let provider = ethers.getDefaultProvider("http://localhost:8545");

describe("Admin Role", () => {



    let adminRole = new ethers.Contract(adminRoleAddress, ADMINABI.abi, provider);

    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();

    })

    // Admin Role
    it('Should check if is Admin', async () => {
        let tx = await adminRole.isAdmin(account2.address);
        // console.log(tx); 
    })

    it('Should add an admin', async () => {
        let tx = await adminRole.connect(account).addAdmin(account2.address);
        //    console.log(tx);
    })

    // it('Should leave admin role', async () => {
    //     let tx = await adminRole.connect(account).leaveAdmin();
    //     //    console.log(tx);
    // })

    it('Should remove an admin', async () => {
        let tx = await adminRole.connect(account).removeAdmin(account2.address);
        //    console.log(tx);
    })





})

