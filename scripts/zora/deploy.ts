import { ethers, run } from "hardhat";

const deploy = async () => {
  const [owner] = await ethers.getSigners();
  const SharedNFTLogic = await ethers.getContractFactory("SharedNFTLogic");
  const DistributedGraphicsEdition = await ethers.getContractFactory("DistributedGraphicsEdition");

  const ZoraFeeManager = await ethers.getContractFactory("ZoraFeeManager");
  const FactoryUpgradeGate = await ethers.getContractFactory("FactoryUpgradeGate");
  const ERC721Drop = await ethers.getContractFactory("ERC721Drop");

  const ZoraNFTCreatorV1 = await ethers.getContractFactory("ZoraNFTCreatorV1");

  const sharedNFTLogic = await SharedNFTLogic.deploy();
  await sharedNFTLogic.deployed();
  const distributedGraphicsEdition = await DistributedGraphicsEdition.deploy(sharedNFTLogic.address);
  await distributedGraphicsEdition.deployed();

  const zoraFeeManager = await ZoraFeeManager.deploy(500, owner.address);
  await zoraFeeManager.deployed();

  const factoryUpgradeGate = await FactoryUpgradeGate.deploy(owner.address);
  await factoryUpgradeGate.deployed();

  const eRC721Drop = await ERC721Drop.deploy(
    zoraFeeManager.address,
    owner.address,
    factoryUpgradeGate.address
  );
  await eRC721Drop.deployed();

  const zoraNFTCreatorV1 = await ZoraNFTCreatorV1.deploy(
    eRC721Drop.address,
    distributedGraphicsEdition.address,
    distributedGraphicsEdition.address
  );
  await zoraNFTCreatorV1.deployed();
  await (await zoraNFTCreatorV1.initialize()).wait();
  console.log("ERC721Drop", eRC721Drop.address);
  console.log("DistributedGraphicsEdition", distributedGraphicsEdition.address);
  console.log("ZoraNFTCreatorV1", zoraNFTCreatorV1.address);
  console.log("Successfully Deployed !!!");
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error: ", error);
    process.exit(1);
  });
