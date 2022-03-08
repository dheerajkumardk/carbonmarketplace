
const NFTContractABI = require('../artifacts/contracts/MintingAndStorage/ERC721NFTContract.sol/ERC721NFTContract.json');
const MintingFactoryABI = require('../artifacts/contracts/MintingAndStorage/MintingFactory.sol/MintingFactory.json');

const { expect, assert } = require("chai");
const { ethers } = require("hardhat");


let account, account2, erc721MintingFactoryInstance, nftContract, nftContractInstance;
let mintingFactoryAddress = "0x2bdCC0de6bE1f7D2ee689a0342D76F52E8EFABa3";
let newExchangeAddress;
let provider = ethers.getDefaultProvider("http://localhost:8545");

erc721MintingFactoryInstance = new ethers.Contract(mintingFactoryAddress, MintingFactoryABI.abi, provider);

// creating an instance of the minting factory
// factoryContractInstance = async () => {
//     const erc721MintingFactory = await ethers.getContractFactory("AltERC721MintingFactory");
//     erc721MintingFactoryInstance = await erc721MintingFactory.deploy();
//     await erc721MintingFactoryInstance.deployed();

//     mintingFactoryAddress = erc721MintingFactoryInstance.address;
//     console.log("Minting Factory Address: ", mintingFactoryAddress);
// }


describe("ERC721MintingFactory", () => {


    // calling the minting factory function to create its instance
    // factoryContractInstance();


    beforeEach(async () => {
        [account, account2] = await ethers.getSigners();

    })



    // WORKING
    it('Should mint NFT contract', async () => {
        // mint NFT contract
        // account = admin
        let nftContractAddress = await erc721MintingFactoryInstance.connect(account).createNFTContract("Royal Challengers Bangalore", "RCB");

        // await nftContractAddress.wait();

        // let nftContract;
        // console.log("Sender:", nftContractAddress.from);

        // listen contract creation event
        erc721MintingFactoryInstance.on("NFTContractCreated", (_name, _symbol, _nftContract) => {
            nftContract = _nftContract;
            console.log(_name, _symbol, _nftContract);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));

        // take nft instance
        nftContractInstance = new ethers.Contract(nftContractAddress, NFTContractABI.abi, account);
        console.log("Contract Address: ", nftContract);
        // console.log(nftContractInstance);
        // expect(await nftContract).to.equal(nftContractAddress);
    })

    // it ('Should return NFT contract created by the user', async () => {
    //     nftContractInstance = new ethers.Contract(nftContract, abi.abi, account);
    //     console.log(nftContract);
    //     console.log(erc721MintingFactoryInstance.getNFTsForOwner(account));

    // })

    it('Should mint an NFT for a contract', async () => {
        let newNFT = await erc721MintingFactoryInstance.connect(account).mintNFT(nftContract);

        // await newNFT.wait()

        // this shows error as it would be called by the creator only 
        let tokenIdMinted;
        erc721MintingFactoryInstance.on("NFTMinted", (_nftContract, _tokenId) => {
            tokenIdMinted = _tokenId;
            console.log(_nftContract, _tokenId);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("TokenID Minted #: ", tokenIdMinted);
    })

    // WORKING FINE
    it('Should return totalNFTs minted for a contract', async () => {
        let totalNFTs = await erc721MintingFactoryInstance.getTotalNFTsMinted(nftContract);

        console.log(totalNFTs);
    })

    // WORKING => But gives undefined
    it('Should return total NFT contract minted by a user', async () => {
        // let totalCollections = await erc721MintingFactoryInstance.getNFTsForOwner(account);
        let totalCollections = await erc721MintingFactoryInstance.getNFTsForOwner(account.address);

        // await totalCollections.wait();

        console.log("total collections: ", totalCollections);
    })

    // WORKING FINE
    it('Should be able to change Exchange Address', async () => {
        let changeAddress = await erc721MintingFactoryInstance.connect(account).updateExchangeAddress(account2.address);
        await changeAddress.wait();



        erc721MintingFactoryInstance.on("ExchangeAddressChanged", (_oldAddress, _newAddress) => {
            newExchangeAddress = _newAddress;
            console.log(_oldAddress, _newAddress);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("New Exchange Address: ", newExchangeAddress);
    })


    // ERROR => Only Exchange can call it, Done that
    it('Should not be able to change NFT owner in mapping', async () => {
        let nftOwnerChange = await erc721MintingFactoryInstance.connect(account2).updateOwner(nftContract, 1, '0x259989150c6302D5A7AeEc4DA49ABfe1464C58fE');
        await nftOwnerChange.wait();

        let newOwner, tokenId;
        erc721MintingFactoryInstance.on("OwnerUpdated", (_nftContract, _tokenId, _newOwner) => {
            newOwner = _newOwner;
            tokenId = _tokenId;
            console.log(_nftContract, _tokenId, _newOwner);
        });
        await new Promise(res => setTimeout(() => res(null), 5000));
        console.log("New Owner Address: ", newOwner, " Token Id: ", tokenId, " old owner: ", account2.address);

    })

    it('Should change the owner', async () => {
        let tx = await erc721MintingFactoryInstance.changeAdmin(account2);
        console.log(tx);
    })



})
