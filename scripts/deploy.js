const hre = require("hardhat");

const deploy = async () => {
  const [owner] = await hre.ethers.getSigners();
  console.log("Balance: ", (await owner.getBalance()).toString());
  const contract = await hre.ethers.getContractFactory("EIP712");

  console.log("Deploying contract ...");
  const instance = await contract.deploy();
  await instance.deployed();
  console.log("EIP712", instance.address);

  await hre.run("verify:verify", {
    address: instance.address,
  });
};

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error: ", error);
    process.exit(1);
  });

