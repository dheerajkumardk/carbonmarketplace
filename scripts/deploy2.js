const main = async () => {
    const [account, account2, account3] = await hre.ethers.getSigners();
    let creator = account3.address;
    
    const Eth = await hre.ethers.getContractFactory("ETHToken");
    const eth = await Eth.connect(account).deploy();
    await eth.deployed();
    console.log("WETH address: ", eth.address);

    const MintingFactory = await hre.ethers.getContractFactory("MintingFactory");
    const mintingFactory = await MintingFactory.deploy(eth.address);
    await mintingFactory.deployed();
    console.log("Minting Factory deployed at: ", mintingFactory.address);

    const ExchangeCore = await hre.ethers.getContractFactory("ExchangeCore");
    const exchangeCore = await ExchangeCore.deploy(mintingFactory.address, eth.address);
    await exchangeCore.deployed();
    console.log("Exchange Core deployed at: ", exchangeCore.address);

    // *****   // accounts3 => creator bana dena

    // creator will mint his nft,
    // then, console log the nft address and creator address.

    // let txn = await nftFactory.createNFTContract("CHENNAI SUPER KINGS", "CSK");
    // await txn.wait()
    // console.log("NFT Contract minted!");

    // // get the contract address now
    // let txn2 = nftFactory.getNFTsForOwner(accounts[0]);
    // await txn.wait();
    // console.log(txn);

    // Deploying : GEMS NFT, TOKEN AND STAKING

    const GEMSToken = await hre.ethers.getContractFactory("GEMSToken");
    const gemsToken = await GEMSToken.deploy();
    await gemsToken.deployed();
    console.log("GEMS Token deployed at : ", gemsToken.address);

    const GEMSNFT = await hre.ethers.getContractFactory("GEMSNFT");
    const gemsNFT = await GEMSNFT.deploy("GEMS NFT", "GEMNT");
    await gemsNFT.deployed();
    console.log("GEMS NFT deployed at : ", gemsNFT.address);

    const GEMSStaking = await hre.ethers.getContractFactory("GEMSStaking");
    const gemsStaking = await GEMSStaking.deploy(gemsToken.address, gemsNFT.address);
    await gemsStaking.deployed();
    console.log("GEMS Staking deployed at : ", gemsStaking.address);

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