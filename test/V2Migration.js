const Address = require("./Addresses.json");

const { expect, assert } = require("chai");
const { ethers } = require("hardhat");


// ABIs
const MintingFactoryABI = require('./../artifacts/contracts/MintingAndStorage/MintingFactory.sol/MintingFactory.json');
const EXCHANGEABI = require("./../artifacts/contracts/Exchange/ExchangeCore.sol//ExchangeCore.json");
const NFTCONTRACTABI = require("./../artifacts/contracts/MintingAndStorage/ERC721NFTContract.sol/ERC721NFTContract.json");

let nftContracts = []; // NFT_CONTRACT
let newAdmin; // owner of Minting Factory

let mintingFactoryAddress = Address.mintingFactoryAddress;
let exchangeAddress = Address.exchangeAddress;
let nftContractAddress;

let account, account2;
let newExchangeAddress;
let newFactoryAddress;
let provider = ethers.getDefaultProvider("http://localhost:8545");

let nftContractAdmin;
let nftContract;
let mintingFactory = new ethers.Contract(mintingFactoryAddress, MintingFactoryABI.abi, provider);
let exchange = new ethers.Contract(exchangeAddress, EXCHANGEABI.abi, provider);

describe("Update Contracts", () => {

    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();
        admin = account.address;
    })

    it('Should be able to change Exchange Address in Minting Factory', async () => {
        let changeAddress = await mintingFactory.connect(account).updateExchangeAddress(exchangeAddress);
        await changeAddress.wait();

        mintingFactory.on("ExchangeAddressChanged", (_oldAddress, _newAddress) => {
            console.log(_oldAddress, _newAddress);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("New Exchange Address: ", exchangeAddress);
    })

    it('Should mint NFT contract in Minting Factory', async () => {
        let tx = await mintingFactory.connect(account).createNFTContract("Royal Challengers Bangalore", "RCB", account.address);

        mintingFactory.on("NFTContractCreated", (_name, _symbol, _nftContract) => {
            nftContractAddress = _nftContract;
            // console.log(_name, _symbol, _nftContract);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log("NFT Contract Address: ", nftContractAddress);
    })
    it('Should mint NFT contract in Minting Factory', async () => {
        let tx = await mintingFactory.connect(account).createNFTContract("Chennai Super Kings", "CSK", account.address);

        mintingFactory.on("NFTContractCreated", (_name, _symbol, _nftContract) => {
            nftContractAddress = _nftContract;
            // console.log(_name, _symbol, _nftContract);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log("NFT Contract Address: ", nftContractAddress);
    })
    it('Should mint NFT contract in Minting Factory', async () => {
        let tx = await mintingFactory.connect(account).createNFTContract("Mumbai Indians", "MI", account.address);

        mintingFactory.on("NFTContractCreated", (_name, _symbol, _nftContract) => {
            nftContractAddress = _nftContract;
            // console.log(_name, _symbol, _nftContract);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log("NFT Contract Address: ", nftContractAddress);
    })
    it('Should mint NFT contract in Minting Factory', async () => {
        let tx = await mintingFactory.connect(account).createNFTContract("Rajasthan Royals", "RR", account.address);

        mintingFactory.on("NFTContractCreated", (_name, _symbol, _nftContract) => {
            nftContractAddress = _nftContract;
            // console.log(_name, _symbol, _nftContract);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log("NFT Contract Address: ", nftContractAddress);
    })
    it('Should mint NFT contract in Minting Factory', async () => {
        let tx = await mintingFactory.connect(account).createNFTContract("Deccan Chargers", "DC", account.address);

        mintingFactory.on("NFTContractCreated", (_name, _symbol, _nftContract) => {
            nftContractAddress = _nftContract;
            // console.log(_name, _symbol, _nftContract);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        console.log("NFT Contract Address: ", nftContractAddress);
    })

    it('Minting Factory set approval for Exchange Contract', async () => {
        nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);
        nftContractAdmin = await nftContract.admin();

        let tx = await nftContract.connect(account).setApprovalForAll(exchangeAddress, true);
        // console.log(tx);
    })

    it('Check set Approval of Minting Factory minted contracts to Exchange', async () => {
        let tx = await nftContract.isApprovedForAll(nftContractAdmin, exchangeAddress);
        console.log(tx);
    })

    // display all old NFT Contracts
    it('Should list all old NFT contracts', async () => {
        let tx = await mintingFactory.getNFTsForOwner(account.address);
        nftContracts = tx;
        console.log(tx);
    })

    // deploy new factory
    it('Should deploy new factory', async () => {
        const MintingFactory = await hre.ethers.getContractFactory("MintingFactory");
        mintingFactory = await MintingFactory.deploy(Address.ethAddress, account.address);
        await mintingFactory.deployed();
        console.log("Minting Factory deployed at: ", mintingFactory.address);
        newFactoryAddress = mintingFactory.address;
        // console.log("New factory: ", newFactoryAddress);
    })

    // deploy new exchange
    it('Should deploy new exchange', async () => {
        const ExchangeCore = await hre.ethers.getContractFactory("ExchangeCore");
        exchange = await ExchangeCore.deploy(mintingFactory.address, Address.ethAddress, Address.carbonMembershipAddress, account.address);
        await exchange.deployed();
        console.log("Exchange Core deployed at: ", exchange.address);
        newExchangeAddress = exchange.address;
    })
    // should update factory in Exchange
    it('Should be able to change Exchange Address in Minting Factory', async () => {
        let changeAddress = await mintingFactory.connect(account).updateExchangeAddress(newExchangeAddress);
        await changeAddress.wait();

        mintingFactory.on("ExchangeAddressChanged", (_oldAddress, _newAddress) => {
            newExchangeAddress = _newAddress;
            console.log(_oldAddress, _newAddress);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("New Exchange Address: ", newExchangeAddress);
    })

    // Should update factory in ERC-721 contract
    it('Should update factory in ERC721 NFT Contract', async () => {
        for (let i = 0; i < nftContracts.length; i++) {
            nftContractAddress = nftContracts[i];
            nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, provider);

            console.log(nftContractAddress);
            console.log("before: ", await nftContract.factory());
            let tx = await nftContract.connect(account).updateFactory(newFactoryAddress);
            console.log("after: ", await nftContract.factory());
        }

    })

    // next - ERC721 ka factory call, check if it matches that of updated factory
    it('Should check if factory matches', async () => {
        for (let i = 0; i < nftContracts.length; i++) {
            nftContractAddress = nftContracts[i];
            nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, provider);

            console.log(newFactoryAddress == await nftContract.factory());

        }
    })

    it('Should update factory in Exchange', async () => {
        let tx = await exchange.connect(account).updateFactory(newFactoryAddress);
    })

    it('Minting Factory set approval for Exchange Contract', async () => {
        for (let i = 0; i < nftContracts.length; i++) {
            nftContractAddress = nftContracts[i];
            nftContract = new ethers.Contract(nftContractAddress, NFTCONTRACTABI.abi, account);
            nftContractAdmin = await nftContract.admin();

            let tx = await nftContract.connect(account).setApprovalForAll(newExchangeAddress, true);
        }
    })






})