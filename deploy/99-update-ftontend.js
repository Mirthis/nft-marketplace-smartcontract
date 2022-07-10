const { ethers, network } = require("hardhat");
const fs = require("fs");

require("dotenv").config();

const frontEndConstantsFile =
  "../nft-marketplace-frontend-moralis/constants/networkMapping.json";

module.exports = async function () {
  const updateContractAddresses = async () => {
    const nftMarketplace = await ethers.getContract("NftMarketplace");
    const chainId = network.config.chainId.toString();
    const contractAddresses = JSON.parse(
      fs.readFileSync(frontEndConstantsFile),
      "utf-8"
    );
    if (chainId in contractAddresses) {
      if (
        !contractAddresses[chainId]["NftMarketplace"].includes(
          nftMarketplace.address
        )
      ) {
        contractAddresses[chainId]["NftMarketplace"].push(
          nftMarketplace.address
        );
      }
    } else {
      contractAddresses[chainId] = { NftMarketplace: [nftMarketplace.address] };
    }

    fs.writeFileSync(frontEndConstantsFile, JSON.stringify(contractAddresses));
  };

  if (process.env.UPDATE_FRONT_END) {
    console.log("updating frontend...");
    await updateContractAddresses();
  }
};

module.exports.tags = ["all", "frontend"];
