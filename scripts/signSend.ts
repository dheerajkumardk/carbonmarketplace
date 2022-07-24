import { ethers } from "ethers";

const signSend = async () => {
  console.log("\nRunning...");

  const connection = new ethers.providers.JsonRpcProvider(`${process.env.RPC_URL}`);
  const gasPrice = connection.getGasPrice();
  const wallet = new ethers.Wallet(`${process.env.PRIVATE_KEY}`, connection);
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

  // const transaction = await signer.sendTransaction(tx);
  // const receipt = await transaction.wait();
  // console.log("Transaction", transaction);
  // console.log("Receipt", receipt.transactionHash);

  const provider = new ethers.providers.AlchemyProvider("mumbai", process.env.MUMBAI_API_KEY);
	// Query the blockchain (replace example parameters)
    	const hash = await provider.sendRawTransaction({
	    signed_data: '0xa1d73e7fa14974da70bb92e1cda42923ea98a34dbd40aa39af94cc069afa6323594f5a7ddea9f77e6aa34eeac1728354a180086cff34d725dbe838ddae2ee1991c',
	  }); 
    
	// Print the output to console
	console.log(hash);
};

signSend()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error: ", error);
    process.exit(1);
  });
