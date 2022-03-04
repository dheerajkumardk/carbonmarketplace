# Development Procedure

Open two terminals

terminal 1:
run the following command:
```npx hardhat node```
This will start a local development blockchain at port 8545

terminal 2:
after setting up terminal 1, run all the other comands in here.
        
Start with running scripts
`npx hardhat run scripts/deployMintingFactory.js --network localhost`
`npx hardhat run scripts/exchangeApprovals.js --network localhost`

Then run test cases
```npx hardhat test --network localhost```

## Staking

GEMS staking pool contract

- Maps the wallet address with the amount of GEMS staked

- Threshold of staking minimum GEMS is 100,000

- Staking wallet address get’s an NFT receipt for staking

- Staked GEMS can be withdrawn by providing the NFT receipt

Once the GEMS are staked in the pool, an event is emitted by the contract. There will be a server which would be continuously listening to the this particular event, and catch it. The server will then update the Staked balance of the user in “Staking Table” in DynamoDB on AWS.