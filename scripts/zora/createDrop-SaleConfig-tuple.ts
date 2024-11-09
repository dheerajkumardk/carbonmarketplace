const { ethers } = require("ethers");

async function main() {
    const url = `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_API}`; // get alchemy api by creating account from www.alchemy.com
    let provider = new ethers.providers.JsonRpcProvider(url);

    let salesConfig = ["struct SalesConfiguration {uint104;uint32;uint64;uint64;uint64;uint64;bytes32}"];
    let iface = new ethers.utils.Interface(salesConfig);

    
       
    

    

}

