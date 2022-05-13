import { ethers, run } from "hardhat";

const fs = require("fs");

const deploy = async () => {
  const [owner] = await ethers.getSigners();
  const admin = owner.address;
  console.log("Admin: ", admin);
  console.log("Balance: ", (await owner.getBalance()).toString());

  const Eth = await ethers.getContractFactory("ETHToken");
  const MintingFactory = await ethers.getContractFactory("MintingFactory");
  const GEMSToken = await ethers.getContractFactory("GEMSToken");
  const GEMSNFTReceipt = await ethers.getContractFactory("GEMSNFTReceipt");
  const GEMSStaking = await ethers.getContractFactory("GEMSStaking");
  const CarbonMembership = await ethers.getContractFactory("CarbonMembership");
  const MembershipTrader = await ethers.getContractFactory("MembershipTrader");
  const ExchangeCore = await ethers.getContractFactory("ExchangeCore");
  const EIP712 = await ethers.getContractFactory("EIP712");

  const eth = await Eth.connect(owner).deploy();
  await eth.deployed();
  console.log("WETH address: ", eth.address);

  const mintingFactory = await MintingFactory.deploy(eth.address, admin);
  await mintingFactory.deployed();
  console.log("Minting Factory deployed at: ", mintingFactory.address);

  // Deploying : GEMS NFT, TOKEN AND STAKING

  const gemsToken = await GEMSToken.deploy();
  await gemsToken.deployed();
  console.log("GEMS Token deployed at : ", gemsToken.address);

  const gemsNFTReceipt = await GEMSNFTReceipt.deploy(
    "GEMS NFT",
    "GEMNT",
    admin
  );
  await gemsNFTReceipt.deployed();
  console.log("GEMS NFT Receipt deployed at : ", gemsNFTReceipt.address);

  const gemsStaking = await GEMSStaking.deploy(
    gemsToken.address,
    gemsNFTReceipt.address
  );
  await gemsStaking.deployed();
  console.log("GEMS Staking deployed at : ", gemsStaking.address);

  const carbonMembership = await CarbonMembership.deploy();
  await carbonMembership.deployed();
  console.log("Carbon Membership deployed at: ", carbonMembership.address);

  const membershipTrader = await MembershipTrader.deploy(
    gemsToken.address,
    carbonMembership.address
  );
  await membershipTrader.deployed();
  console.log("Membership Trader deployed at: ", membershipTrader.address);

  const exchangeCore = await ExchangeCore.deploy(
    mintingFactory.address,
    eth.address,
    carbonMembership.address,
    admin
  );
  await exchangeCore.deployed();
  console.log("Exchange Core deployed at: ", exchangeCore.address);

  const eip712 = await EIP712.deploy();
  await eip712.deployed();
  console.log("EIP712 deployed at", eip712.address);

  if (eth.deployTransaction.chainId == 80001) {
    fs.writeFileSync(
      __dirname + "/mumbaiAddresses.json",
      `
        {
            "ethAddress" : "${eth.address}",
            "mintingFactoryAddress" : "${mintingFactory.address}",
            "exchangeAddress" : "${exchangeCore.address}",
            "gemsTokenAddress" : "${gemsToken.address}",
            "gemsNFTReceiptAddress" : "${gemsNFTReceipt.address}",
            "gemsStakingAddress" : "${gemsStaking.address}",
            "carbonMembershipAddress" : "${carbonMembership.address}",
            "membershipTraderAddress" : "${membershipTrader.address}",
            "eip712": "${eip712.address}"
         }
        `
    );
  } else {
    fs.writeFileSync(
      __dirname + "/../test/Addresses.json",
      `
        {
            "ethAddress" : "${eth.address}",
            "mintingFactoryAddress" : "${mintingFactory.address}",
            "exchangeAddress" : "${exchangeCore.address}",
            "gemsTokenAddress" : "${gemsToken.address}",
            "gemsNFTReceiptAddress" : "${gemsNFTReceipt.address}",
            "gemsStakingAddress" : "${gemsStaking.address}",
            "carbonMembershipAddress" : "${carbonMembership.address}",
            "membershipTraderAddress" : "${membershipTrader.address}",
            "eip712": "${eip712.address}"
         }
        `
    );
  }
  // Contract Verification
  try {
    await run("verify:verify", {
      address: eip712.address,
    });
  } catch (error) {
    console.log(error);
  }
};

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error: ", error);
    process.exit(1);
  });
