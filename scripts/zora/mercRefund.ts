// const { ethers } = require("ethers");

async function main() {
    const [signer, signer2, signer3] = await ethers.getSigners();

    const MercRefund = await ethers.getContractFactory("MercRefund");
    const mercRefund = await MercRefund.deploy();
    await mercRefund.deployed()
    
    let bal = await signer.getBalance();
    let bal2 = await signer2.getBalance();
    let bal3 = await signer3.getBalance();
    console.log("balance before:")
    console.log(signer.address, bal)
    console.log(signer2.address, bal2)
    console.log(signer3.address, bal3)

    const receipt = await mercRefund.connect(signer).refund([signer2.address, signer3.address], {
        value: "200000000000000000"
    });
    console.log(await receipt.wait())

    bal = await signer.getBalance();
    bal2 = await signer2.getBalance();
    bal3 = await signer3.getBalance();
    console.log("balance before:")
    console.log(signer.address, bal)
    console.log(signer2.address, bal2)
    console.log(signer3.address, bal3)
}

main()