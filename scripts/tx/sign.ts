require("dotenv").config();
import { createAlchemyWeb3 } from "@alch/alchemy-web3";

const sign = async () => {
  const { ALCHEMY_MUMBAI_RPC, PRIVATE_KEY } = process.env;
  const web3 = createAlchemyWeb3(`${ALCHEMY_MUMBAI_RPC}`);
  const myAddress = "0xA320b33d9E0f67960E92b327ad6F073e6670e55c";
  const nonce = await web3.eth.getTransactionCount(myAddress, "latest");
  const transaction = {
    data: "0xa9059cbb000000000000000000000000a320b33d9e0f67960e92b327ad6f073e6670e55c0000000000000000000000000000000000000000000000000000000000000001",
    to: "0xEf101840250783B6F1004510333c7a6F37B1452a",
    from: "0xA320b33d9E0f67960E92b327ad6F073e6670e55c",
    nonce: nonce,
    gas: 70000
  };
  const signedTx = await web3.eth.accounts.signTransaction(
    transaction,
    `${PRIVATE_KEY}`
  );
  console.log("signedTx", signedTx);
};

sign()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error: ", error);
    process.exit(1);
  });
