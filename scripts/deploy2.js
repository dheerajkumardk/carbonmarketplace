const main = async () => {
    const MintingFactory = await hre.ethers.getContractFactory("MintingFactory");
    const mintingFactory = await MintingFactory.deploy();
    await mintingFactory.deployed();
    console.log("Minting Factory deployed at: ", mintingFactory.address);

    const [account, account2, account3] = await hre.ethers.getSigners();
    let creator = account3.address;

    const Weth = await hre.ethers.getContractFactory("WETHToken");
    const weth = await Weth.connect(account).deploy();
    await weth.deployed();
    console.log("WETH address: ", weth.address);

    const ExchangeCore = await hre.ethers.getContractFactory("ExchangeCore");
    const exchangeCore = await ExchangeCore.deploy(mintingFactory.address, weth.address);
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