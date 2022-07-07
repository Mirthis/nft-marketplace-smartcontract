const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }) => {
  console.log("------ Start BasicNft deployment script");
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const args = [];
  const basicNft = await deploy("BasicNft", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.blockConfirmations,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("Verifying...");
    await verify(basicNft.address, args);
  }
  console.log("------ Completed BasicNft deployment script");
};

module.exports.tags = ["all", "basicnft", "main"];
