import { ethers } from "ethers";

const abi = require("../abis/erc20.json").abi;

const signSend = async () => {
  console.log("\nRunning...");

  const connection = new ethers.providers.JsonRpcProvider(
    "https://matic-mumbai.chainstacklabs.com"
  );
  const wallet = new ethers.Wallet(
    "0x8de751721cdcca853f76eac9994889eb77e4baac924b083f6eadae31702e102b"
  );
  const signer = wallet.connect(connection);
  const unsignedTx = {
    data: "0xa9059cbb000000000000000000000000a320b33d9e0f67960e92b327ad6f073e6670e55c0000000000000000000000000000000000000000000000000000000000000001",
    to: "0xEf101840250783B6F1004510333c7a6F37B1452a"
  };
  const transaction = await signer.sendTransaction(unsignedTx);
  const receipt = await transaction.wait();
  console.log("Transaction", transaction);
  console.log("Receipt", receipt.transactionHash);
};

signSend()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error: ", error);
    process.exit(1);
  });
