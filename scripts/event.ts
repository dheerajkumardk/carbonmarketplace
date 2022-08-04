const { ethers } = require("ethers");

async function main() {
    const url = `https://polygon-mumbai.g.alchemy.com/v2/1lo5rOEtPbYlohlrOYiNa9xTUc2Qm8uD`;
    let provider = new ethers.providers.JsonRpcProvider(url);

    const txid = "0x1a3239d61fd5ce2f71e2bb5ddc8dc005407ccd3a46693044ba75224c9c7331df";

    const tx = await provider.getTransactionReceipt(txid);
    // console.log(tx.logs)
    const exchange = "0xec40d478937399F3924cac9748f9205aC03dc410";
    const factory = "0x5d9567f2f98d85492d30df47872e53102d7b768e";
    const filteredEvents = tx.logs.filter((log:any) => log.address == exchange);
    console.log(filteredEvents);
    
    function ExecuteOrderLog(filteredEvents: any) {
        // let executeOrderABI = ["event OrderExecuted(address indexed nftContract, uint256 tokenId, address indexed seller, address indexed buyer, uint256 totalCarbonRoyalties, uint256 creatorRoyalties, uint8 mode)"];
        // let iface = new ethers.utils.Interface(executeOrderABI);
        
        // filteredEvents.forEach((log:any) => {
        //     let parsed = iface.parseLog(log);
            
        //     let { nftContract, tokenId, seller, buyer, totalCarbonRoyalties, creatorRoyalties, mode } = parsed.args;

        //     console.log("contract", nftContract, "\ntokenId", tokenId.toString(), "\nseller", seller, "\nbuyer", buyer, "\ntotalCarbonRoaylty", totalCarbonRoyalties.toString(), "\ncreatorRoyalty", creatorRoyalties.toString(), "\nmode", mode);            
        // })

        let executeOrderABI = ["event OrderExecuted(address indexed nftContract, uint256 tokenId, address indexed seller, address indexed buyer, uint256 totalCarbonRoyalties, uint256 creatorRoyalties, uint8 mode)"];
        let iface = new ethers.utils.Interface(executeOrderABI);
        let tokenId, totalCarbonRoyalties, creatorRoyalties, buyer;
        filteredEvents.forEach((log:any) => {
            let parsed = iface.parseLog(log);
            console.log("parsed logs", parsed.args);
            tokenId = parsed.args.tokenId;
            buyer = parsed.args.buyer;
            totalCarbonRoyalties = parsed.args.totalCarbonRoyalties;
            creatorRoyalties = parsed.args.creatorRoyalties;
        });

    }
    
    ExecuteOrderLog(filteredEvents)

    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
