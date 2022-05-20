// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library Clones {
     function cloneDeterministic(address implementation, bytes32 salt) internal returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x602d8060093d393df3363d3d373d3d3d363d7300000000000000000000000000)
            mstore(add(ptr, 0x13), shl(0x60, implementation))
            mstore(add(ptr, 0x27), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create2(0, ptr, 0x36, salt)
        }
        require(instance != address(0), "ERC1167: create2 failed");
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt,
        address deployer
    ) internal pure returns (address predicted) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x602d8060093d393df3363d3d373d3d3d363d7300000000000000000000000000)
            mstore(add(ptr, 0x13), shl(0x60, implementation))
            mstore(add(ptr, 0x27), 0x5af43d82803e903d91602b57fd5bf3ff00000000000000000000000000000000)
            mstore(add(ptr, 0x37), shl(0x60, deployer))
            mstore(add(ptr, 0x4b), salt)
            mstore(add(ptr, 0x6b), keccak256(ptr, 0x36))
            predicted := keccak256(add(ptr, 0x36), 0x55)
        }
    }
}