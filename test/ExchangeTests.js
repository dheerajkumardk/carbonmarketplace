const Address = require("./Addresses.json");

const { ethers } = require("hardhat");


// ABIs
const MintingFactoryABI = require('../artifacts/contracts/MintingAndStorage/MintingFactory.sol/MintingFactory.json');
const ETHTOKENABI = require("../artifacts/contracts/ETHToken.sol/ETHToken.json");
const EXCHANGEABI = require("../artifacts/contracts/Exchange/ExchangeCore.sol/ExchangeCore.json");
const GEMSTOKENABI = require("../artifacts/contracts/Staking/GEMSToken.sol/GEMSToken.json");
const CARBONMEMBERSHIPABI = require("../artifacts/contracts/Membership/CarbonMembership.sol/CarbonMembership.json");
const MEMBERSHIPTRADERABI = require("../artifacts/contracts/Membership/MembershipTrader.sol/MembershipTrader.json");
const NFTCONTRACTABI = require("../artifacts/contracts/MintingAndStorage/ERC721NFTContract.sol/ERC721NFTContract.json");

let nftContract; // NFT_CONTRACT
let tokenId = 1;

let ethAddress = Address.ethAddress;
let mintingFactoryAddress = Address.mintingFactoryAddress;
let exchangeAddress = Address.exchangeAddress;
let gemsTokenAddress = Address.gemsTokenAddress;
let carbonMembershipAddress = Address.carbonMembershipAddress;
let membershipTraderAddress = Address.membershipTraderAddress;
let nftContractAddress;

let account, account2;
let newExchangeAddress;
let provider = ethers.getDefaultProvider("http://localhost:8545");

let nftContractAdmin;

let mintingFactory = new ethers.Contract(mintingFactoryAddress, MintingFactoryABI.abi, provider);
let eth = new ethers.Contract(ethAddress, ETHTOKENABI.abi, provider);
let exchange = new ethers.Contract(exchangeAddress, EXCHANGEABI.abi, provider);
let gemsToken = new ethers.Contract(gemsTokenAddress, GEMSTOKENABI.abi, provider);
let carbonMembership = new ethers.Contract(carbonMembershipAddress, CARBONMEMBERSHIPABI.abi, provider);
let membershipTrader = new ethers.Contract(membershipTraderAddress, MEMBERSHIPTRADERABI.abi, provider);

describe("Execute Order", () => {

    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();
        admin = account.address;
    })

    it('Should be able to change Exchange Address in Minting Factory', async () => {
        let changeAddress = await mintingFactory.connect(account).updateExchangeAddress(exchangeAddress);
        await changeAddress.wait();

        mintingFactory.on("ExchangeAddressChanged", (_oldAddress, _newAddress) => {
            newExchangeAddress = _newAddress;
            console.log(_oldAddress, _newAddress);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("New Exchange Address: ", newExchangeAddress);
    })

    it('Should set Carbon Vault Fee Address in Exchange', async () => {
        let tx = await exchange.connect(account).setCarbonFeeVaultAddress(account2.address);
        // console.log(tx);
    })

    it ('Should set Carbon Fee Vault in membership trader', async () => {
        let tx = membershipTrader.connect(account).setCarbonFeeVault(account2.address);
    })

    it('Should mint NFT contract in Minting Factory', async () => {
        let tx = await mintingFactory.connect(account).createNFTContract("Royal Challengers Bangalore", "RCB", account.address);

        mintingFactory.on("NFTContractCreated", (_name, _symbol, _nftContract) => {
            nftContractAddress = _nftContract;
            console.log(_name, _symbol, _nftContract);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);

        console.log("NFT Contract Address: ", nftContractAddress);
    })
    it('Minting Factory set approval for Exchange Contract', async () => {
        nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);
        nftContractAdmin = await nftContract.admin();

        let tx = await nftContract.connect(account).setApprovalForAll(exchangeAddress, true);
    })
    it('Check set Approval of Minting Factory minted contracts to Exchange', async () => {
        let tx = await nftContract.isApprovedForAll(nftContractAdmin, exchangeAddress);
        console.log(tx);
    })

    // Minting 6 NFTs for the NFTContract
    it('Should mint an NFT for a contract from Minting Factory - 01', async () => {
        let newNFT = await mintingFactory.connect(account).mintNFT(nftContractAddress);

        let tokenIdMinted;
        mintingFactory.on("NFTMinted", (_nftContract, _tokenId) => {
            tokenIdMinted = _tokenId;
            // console.log(_nftContract, _tokenId.toString());
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("TokenID Minted #: ", tokenIdMinted.toString());
    })
    it('Should mint an NFT for a contract from Minting Factory - 02', async () => {
        let newNFT = await mintingFactory.connect(account).mintNFT(nftContractAddress);

        let tokenIdMinted;
        mintingFactory.on("NFTMinted", (_nftContract, _tokenId) => {
            tokenIdMinted = _tokenId;
            // console.log(_nftContract, _tokenId.toString());
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("TokenID Minted #: ", tokenIdMinted.toString());
    })
    it('Should mint an NFT for a contract from Minting Factory - 03', async () => {
        let newNFT = await mintingFactory.connect(account).mintNFT(nftContractAddress);

        let tokenIdMinted;
        mintingFactory.on("NFTMinted", (_nftContract, _tokenId) => {
            tokenIdMinted = _tokenId;
            // console.log(_nftContract, _tokenId.toString());
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("TokenID Minted #: ", tokenIdMinted.toString());
    })
    it('Should mint an NFT for a contract from Minting Factory - 04', async () => {
        let newNFT = await mintingFactory.connect(account).mintNFT(nftContractAddress);

        let tokenIdMinted;
        mintingFactory.on("NFTMinted", (_nftContract, _tokenId) => {
            tokenIdMinted = _tokenId;
            // console.log(_nftContract, _tokenId.toString());
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("TokenID Minted #: ", tokenIdMinted.toString());
    })
    it('Should mint an NFT for a contract from Minting Factory - 05', async () => {
        let newNFT = await mintingFactory.connect(account).mintNFT(nftContractAddress);

        let tokenIdMinted;
        mintingFactory.on("NFTMinted", (_nftContract, _tokenId) => {
            tokenIdMinted = _tokenId;
            // console.log(_nftContract, _tokenId.toString());
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("TokenID Minted #: ", tokenIdMinted.toString());
    })
    it('Should mint an NFT for a contract from Minting Factory - 06', async () => {
        let newNFT = await mintingFactory.connect(account).mintNFT(nftContractAddress);

        let tokenIdMinted;
        mintingFactory.on("NFTMinted", (_nftContract, _tokenId) => {
            tokenIdMinted = _tokenId;
            // console.log(_nftContract, _tokenId.toString());
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("TokenID Minted #: ", tokenIdMinted.toString());
    })

    it('Should Approve some tokens for Buy Order to the Exchange', async () => {
        let allowanceAmt = "100000"; // 1 ETH
        // approves amount tokens
        let tx = await eth.connect(account).approve(exchangeAddress, ethers.utils.parseEther(allowanceAmt));
    })

    it('Should execute the order in Exchange - Mode 0', async () => {
        let auctionTime = 1748203441;
        let amount = "1025";

        console.log("user bal before execute order:", (await eth.balanceOf(account.address)).toString());
        let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, ethers.utils.parseEther(amount), auctionTime, 0);
        console.log("user bal after execute order:", (await eth.balanceOf(account.address)).toString());


    })

    it('Should execute the order in Exchange - Mode 1', async () => {
        let auctionTime = 1748203441;
        let amount = "1025";
        tokenId = 2;

        console.log("user bal before execute order:", (await eth.balanceOf(account.address)).toString());
        let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, ethers.utils.parseEther(amount), auctionTime, 1);
        console.log("user bal after execute order:", (await eth.balanceOf(account.address)).toString());


    })

    it('Should execute the order in Exchange - Mode 2', async () => {
        let auctionTime = 1748203441;
        let amount = "1025";
        tokenId = 3;

        console.log("user bal before execute order:", (await eth.balanceOf(account.address)).toString());
        let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, ethers.utils.parseEther(amount), auctionTime, 2);
        console.log("user bal after execute order:", (await eth.balanceOf(account.address)).toString());


    })

    it('Should set Membership Trader in Carbon Membership Contract', async () => {
        let tx = await carbonMembership.connect(account).setMembershipTrader(membershipTraderAddress);
        // console.log(tx);
    })

    

    it('Should approve funds in GEMS Token to membership trader', async () => {
        let tx = await gemsToken.connect(account).approve(membershipTraderAddress, 100000);
        // console.log(tx);
        console.log((await gemsToken.allowance(account.address, membershipTraderAddress)).toString());
    })

    it('Should execute the order for Membership pass', async () => {
        console.log("bal. membership Trader before : ", (await gemsToken.balanceOf(membershipTraderAddress)).toString());
        console.log("user bal. before ", (await carbonMembership.balanceOf(account.address)).toString());

        let tx = await membershipTrader.connect(account).executeOrder(account.address);

        // console.log(tx);
        console.log("bal. membership Trader after : ", (await gemsToken.balanceOf(membershipTraderAddress)).toString());
        console.log("user bal. after ", (await carbonMembership.balanceOf(account.address)).toString());
    })


    it('Should execute the order in Exchange - With Membership Pass - Mode 0', async () => {
        let auctionTime = 1748203441;
        let amount = "1025";
        tokenId = 4;

        console.log("user bal before execute order:", (await eth.balanceOf(account.address)).toString());
        let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, ethers.utils.parseEther(amount), auctionTime, 0);
        console.log("user bal after execute order:", (await eth.balanceOf(account.address)).toString());

    })

    it('Should execute the order in Exchange - With Membership Pass - Mode 1', async () => {
        let auctionTime = 1748203441;
        let amount = "1025";
        tokenId = 5;

        console.log("user bal before execute order:", (await eth.balanceOf(account.address)).toString());
        let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, ethers.utils.parseEther(amount), auctionTime, 1);
        console.log("user bal after execute order:", (await eth.balanceOf(account.address)).toString());

    })

    it('Should execute the order in Exchange - With Membership Pass - Mode 2', async () => {
        let auctionTime = 1748203441;
        let amount = "1025";
        tokenId = 6;

        console.log("user bal before execute order:", (await eth.balanceOf(account.address)).toString());
        let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, ethers.utils.parseEther(amount), auctionTime, 2);
        console.log("user bal after execute order:", (await eth.balanceOf(account.address)).toString());

    })

})

describe("Cancel Order", () => {

    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();
        admin = account.address;
    })

    it('Should cancel the order in Exchange', async () => {
        tokenId = 4;
        let cancelOrder = await exchange.connect(account).cancelOrder(nftContractAddress, tokenId, account.address);
        // console.log(cancelOrder);
    })

    it('Should execute the order in Exchange - With Membership Pass - Mode 0 - Cancel Order', async () => {
        let auctionTime = 1748203441;
        let amount = "1025";
        tokenId = 4;

        console.log("user bal before execute order:", (await eth.balanceOf(account.address)).toString());
        let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, ethers.utils.parseEther(amount), auctionTime, 0);
        console.log("user bal after execute order:", (await eth.balanceOf(account.address)).toString());

    })

    it('Should uncancel the order in Exchange', async () => {
        tokenId = 4;
        let cancelOrder = await exchange.connect(account).uncancelOrder(nftContractAddress, tokenId, account.address);
        // console.log(cancelOrder);
    })

    it('Should execute the order in Exchange - With Membership Pass - Mode 0 - Order uncancelled', async () => {
        let auctionTime = 1748203441;
        let amount = "1025";
        tokenId = 4;

        console.log("user bal before execute order:", (await eth.balanceOf(account.address)).toString());
        let executeOrder = await exchange.connect(account).executeOrder(nftContractAddress, tokenId, account.address, nftContractAdmin, ethers.utils.parseEther(amount), auctionTime, 0);
        console.log("user bal after execute order:", (await eth.balanceOf(account.address)).toString());

    })

})