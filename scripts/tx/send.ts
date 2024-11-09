require("dotenv").config();
import { createAlchemyWeb3 } from "@alch/alchemy-web3";

const sendRaw = async () => {
  const { ALCHEMY_MUMBAI_RPC } = process.env;
  const web3 = createAlchemyWeb3(`${ALCHEMY_MUMBAI_RPC}`);
  // @ts-ignore
  const tx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  console.log("Hash", tx);
};

sendRaw()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error: ", error);
    process.exit(1);
  });
