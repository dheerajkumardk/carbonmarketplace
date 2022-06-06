import { log } from "console";
import { ethers, run, upgrades } from "hardhat";

const deploy = async () => {
    const [owner] = await ethers.getSigners();
    const admin = owner.address;
    console.log("Admin: ", admin);
    console.log("Balance: ", (await owner.getBalance()).toString());

    const Weth = await ethers.getContractFactory("ETHToken");
    const CollectionFactory = await ethers.getContractFactory("Collection");
    const MintingFactory = await ethers.getContractFactory("MintingFactory");
    const AdminRegistry = await ethers.getContractFactory("AdminRegistry");

    const adminRegistry = await AdminRegistry.deploy(admin);
    await adminRegistry.deployed();
    console.log("Admin Registry deployed at: ", adminRegistry.address);
    
    const collection = await CollectionFactory.deploy();
    await collection.deployed();
    console.log("Implementation deployed at: ", collection.address);
    
    const weth = await Weth.connect(owner).deploy();
    await weth.deployed();
    console.log("WETH address: ", weth.address);
  
    const mintingFactory = await MintingFactory.deploy(weth.address, adminRegistry.address, collection.address);
    await mintingFactory.deployed();
    console.log("Minting Factory deployed at: ", mintingFactory.address);

    console.log("creating nft collection...");
  
    let tx = await mintingFactory.connect(owner).createCollection("UP Yoddha", "UPY", admin, 0, "https://carbon.xyz/");
    const receipt = await tx.wait();
    let event = receipt.events?.find((event: any) => event.event === "CollectionCreated");
    console.log("name: ", event?.args?.name);
    console.log("symbol: ", event?.args?.symbol);
    console.log("contract: ", event?.args?.nftContract);
    console.log("creator: ", event?.args?.creator);

    console.log("\n");

    let nftContract: any;
    nftContract = event?.args?.nftContract;

    await new Promise((res) => setTimeout(() => res(null), 20000));

    console.log("verifying minting factory...");
    try {
        await run("verify:verify", {
        address: mintingFactory.address,
        constructorArguments: [
            weth.address,
            adminRegistry.address,
            collection.address,
        ]
        });
    } catch (error) {
        console.log(error);
    }

    console.log("verifying collection...");
    console.log("contract address to verify: ", nftContract);
    
    try {
        await run("verify:verify", { 
            address: collection.address,
        });
    } catch (error) {
        console.log(error);
    }
  
  }

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error: ", error);
    process.exit(1);
  });
