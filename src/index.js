const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const { ethers, JsonRpcProvider } = require("ethers");

const data = require("../db/data.json");
const contractABI = require("./artifacts/Carbon.json");

const server = express();

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));

const NETWORK_URL = "http://127.0.0.1:8545/";

const provider = new JsonRpcProvider(NETWORK_URL);

// 1.0: read from data/tokens.json file
// 2.0: create a new token
// - id
// - companyId
// - country
// 3.0: write to data/tokens.json file
// 4.0: return tokenURI (for airdrop function)

async function writeTokenMetadata(tokenId, companyId, country) {
  const newToken = {
    id: tokenId,
    companyId,
    country,
  };

  const filePath = path.resolve(__dirname, `../db/tokens/${tokenId}.json`);

  await fs.writeFileSync(filePath, JSON.stringify(newToken), "utf-8");

  console.log("Token Metadata stored.");

  return newToken;
}

server.post("/companies/:companyId/credits", async (req, res) => {
  const { companyId } = req.params;
  const { carbonCredits } = req.body;

  const signer = await provider.getSigner();

  const Carbon = new ethers.Contract(
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    contractABI.abi,
    signer
  );

  Carbon.safeMint;

  console.log({ signer, Carbon });

  let updatedCompany = null;

  const updatedCompanies = data.companies.map((company) => {
    if (company.id !== parseInt(companyId)) return company;

    updatedCompany = company;

    return {
      ...company,
      carbonCredits: (company.carbonCredits += carbonCredits),
    };
  });

  data.companies = updatedCompanies;

  const tokenId = data.tokens.length + 1;

  const newToken = await writeTokenMetadata(
    tokenId,
    companyId,
    updatedCompany.country
  );

  data.tokens = [...data.tokens, newToken];

  res.json({ data });
});

server.listen("6969", () => {
  console.log("Server On at http://localhost:6969");
});
