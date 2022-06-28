import { ethers } from "ethers";

const signSend = async () => {
  console.log("\nRunning...");

  const connection = new ethers.providers.JsonRpcProvider(`${process.env.RPC_URL}`);
  const gasPrice = connection.getGasPrice();
  const wallet = ethers.Wallet.fromMnemonic(`${process.env.MNEMONIC}`);
  const signer = wallet.connect(connection);
  const recipient = `${process.env.RECEPIENT}`;
  const tx = {
    from: wallet.address,
    to: recipient,
    value: ethers.utils.parseUnits("0.02", "ether"),
    gasPrice: gasPrice,
    gasLimit: ethers.utils.hexlify(100000),
    nonce: connection.getTransactionCount(wallet.address, "latest")
  };

  const transaction = await signer.sendTransaction(tx);
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
