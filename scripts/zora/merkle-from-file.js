const { makeTree } = require("./merkle.js");
const { parseEther } = require("@ethersproject/units");
const { join } = require("path");
const { readFile, writeFile } = require("fs/promises");
// import esMain from "es-main";

const { dirname } = require("path");
const { fileURLToPath } = require("url");

// const __dirname = dirname(fileURLToPath(import.meta.url));

async function generateTree(filename) {
  const entries = JSON.parse(await readFile(filename));
  const treeResult = makeTree(entries);
  const resultItem = {};
  resultItem.entries = treeResult.entries;
  resultItem.root = treeResult.root;

  console.log(JSON.stringify(resultItem, null, 2));
}


  const filename = "test.json";
   generateTree(filename);
