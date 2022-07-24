const { MerkleTree } = require("merkletreejs");
const { defaultAbiCoder } = require("@ethersproject/abi");
const { hexValue } = require("@ethersproject/bytes");
const { getAddress } = require("@ethersproject/address");
const keccak256 = require("keccak256");

// "merkletreejs": "^0.2.31"
// "keccak256": "^1.0.6"

function hashForEntry(entry) {
  return keccak256(
    defaultAbiCoder.encode(
      ["address", "uint256", "uint256"],
      [getAddress(entry.minter), entry.maxCount, entry.price]
    )
  );
}

// Entries: [{minter: 0xafff, maxCount: 20, price: 0.2*10**18}, ...]
module.exports.makeTree = function (entries) {
  entries = entries.map((entry) => {
    entry.hash = hashForEntry(entry);
    console.error(Buffer.from(entry.hash).toString('base64'));
    return entry;
  });
  const tree = new MerkleTree(
    entries.map((entry) => entry.hash),
    keccak256,
    { sortPairs: true }
  );
  entries = entries.map((entry, indx) => {
    entry.hash = hexValue(entry.hash);
    entry.proof = tree.getHexProof(entry.hash, indx);
    return entry;
  });

  return {
    tree,
    root: tree.getHexRoot(),
    entries,
  };
}