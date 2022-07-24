const {ethers} = require("hre");

async function main() {
    const [owner] = await ethers.getSigners();
    const Weth = await ethers.getContractFactory("ETHToken");

    const weth = await Weth.connect(owner).deploy();
    await weth.deployed();
    console.log("WETH address: ", weth.address);

    const receipt = await owner.sendTransaction({
        from: owner.address,
        to: "0x7bBD77cd941426D77ddaA623Bc9b1F6f0a07db42",
        value: ethers.utils.parseEther("10")
    })
}

main()