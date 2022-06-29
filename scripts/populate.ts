import { ethers } from "ethers";

let abi = require("../abis/erc20.json").abi;

let populate = async () => {
  console.log("\nRunning...");

  let connection = new ethers.providers.JsonRpcProvider(
    // provider url RPS
  );
  let wallet = new ethers.Wallet(
    // private key
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

  let signTx = await signer.signTransaction(unsignedTx);
  console.log("signTx", signTx);

  console.log("Transacting...");
  let transaction = await signer.sendTransaction(unsignedTx);
  let receipt = await transaction.wait();
  console.log("Transaction", transaction);
  console.log("Receipt", receipt.transactionHash);
};

populate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error: ", error);
    process.exit(1);
  });
