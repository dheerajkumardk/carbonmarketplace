import { ethers } from "ethers";

let abi = require("../abis/erc20.json").abi;

const populate = async () => {
  console.log("\nRunning...");
  const { ALCHEMY_MUMBAI_RPC, PRIVATE_KEY } = process.env;

  let connection = new ethers.providers.JsonRpcProvider(
    `${ALCHEMY_MUMBAI_RPC}`
  );
  let wallet = new ethers.Wallet(
    `${PRIVATE_KEY}`
  );
  let signer = wallet.connect(connection);

  let token = new ethers.Contract(
    "0xEf101840250783B6F1004510333c7a6F37B1452a",
    abi,
    signer
  );

  let unsignedTx = await token.populateTransaction.transfer(
    wallet.address,
    "1"
  );
  console.log("unsignedTx", unsignedTx);
};

populate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error: ", error);
    process.exit(1);
  });
