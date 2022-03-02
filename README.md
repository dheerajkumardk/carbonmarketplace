# Development Procedure

1. Open two terminals
    terminal 1:
        run the following command:
        ```
        npx hardhat node
        ```

        This will start a local development blockchain at port 8545

    terminal 2:
        after setting up terminal 1, run all the other comands in here.
        
        Start with running scripts
        ```
        npx hardhat run scripts/deployMintingFactory.js --network localhost
        npx hardhat run scripts/exchangeApprovals.js --network localhost
        ```

        Then run test cases
        ```
        npx hardhat test --network localhost
        ```
