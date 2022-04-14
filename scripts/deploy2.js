const fs = require('fs');

const main = async () => {
    const [account, account2, account3] = await hre.ethers.getSigners();
    // let creator = account3.address;
    // let stakingPool = account2.address;
    let admin = account.address;

    const Eth = await hre.ethers.getContractFactory("ETHToken");
    const eth = await Eth.connect(account).deploy();
    await eth.deployed();
    console.log("WETH address: ", eth.address);

    const MintingFactory = await hre.ethers.getContractFactory("MintingFactory");
    const mintingFactory = await MintingFactory.deploy(eth.address, account.address);
    await mintingFactory.deployed();
    console.log("Minting Factory deployed at: ", mintingFactory.address);

    // Deploying : GEMS NFT, TOKEN AND STAKING

    const GEMSToken = await hre.ethers.getContractFactory("GEMSToken");
    const gemsToken = await GEMSToken.deploy();
    await gemsToken.deployed();
    console.log("GEMS Token deployed at : ", gemsToken.address);

    const GEMSNFTReceipt = await hre.ethers.getContractFactory("GEMSNFTReceipt");
    const gemsNFTReceipt = await GEMSNFTReceipt.deploy("GEMS NFT", "GEMNT", account.address);
    await gemsNFTReceipt.deployed();
    console.log("GEMS NFT Receipt deployed at : ", gemsNFTReceipt.address);

    const GEMSStaking = await hre.ethers.getContractFactory("GEMSStaking");
    const gemsStaking = await GEMSStaking.deploy(gemsToken.address, gemsNFTReceipt.address);
    await gemsStaking.deployed();
    console.log("GEMS Staking deployed at : ", gemsStaking.address);


    const CarbonMembership = await hre.ethers.getContractFactory("CarbonMembership");
    const carbonMembership = await CarbonMembership.deploy("CARBON MEMBERSHIP PASS", "CMEM");
    await carbonMembership.deployed();
    console.log("Carbon Membership deployed at: ", carbonMembership.address);

    const MembershipTrader = await hre.ethers.getContractFactory("MembershipTrader");
    const membershipTrader = await MembershipTrader.deploy(gemsToken.address, carbonMembership.address);
    await membershipTrader.deployed();
    console.log("Membership Trader deployed at: ", membershipTrader.address);

    const ExchangeCore = await hre.ethers.getContractFactory("ExchangeCore");
    const exchangeCore = await ExchangeCore.deploy(mintingFactory.address, eth.address, carbonMembership.address, account.address);
    await exchangeCore.deployed();
    console.log("Exchange Core deployed at: ", exchangeCore.address);

    if(eth.deployTransaction.chainId == 80001) {
        fs.writeFileSync(__dirname + '/mumbaiAddresses.json', `
        {
            "ethAddress" : "${eth.address}",
           "mintingFactoryAddress" : "${mintingFactory.address}",
           "exchangeAddress" : "${exchangeCore.address}",
           "gemsTokenAddress" : "${gemsToken.address}",
           "gemsNFTReceiptAddress" : "${gemsNFTReceipt.address}",
           "gemsStakingAddress" : "${gemsStaking.address}",
           "carbonMembershipAddress" : "${carbonMembership.address}",
           "membershipTraderAddress" : "${membershipTrader.address}"
         }
        `)
    } else {
        fs.writeFileSync(__dirname + '/../test/Addresses.json', `
        {
            "ethAddress" : "${eth.address}",
           "mintingFactoryAddress" : "${mintingFactory.address}",
           "exchangeAddress" : "${exchangeCore.address}",
           "gemsTokenAddress" : "${gemsToken.address}",
           "gemsNFTReceiptAddress" : "${gemsNFTReceipt.address}",
           "gemsStakingAddress" : "${gemsStaking.address}",
           "carbonMembershipAddress" : "${carbonMembership.address}",
           "membershipTraderAddress" : "${membershipTrader.address}"
         }
        `)
    }

}

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

runMain();