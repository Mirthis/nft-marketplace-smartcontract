const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/moveBlocks");

const TOKEN_ID = 5;

const cancelItem = async () => {
  const nftMarketplace = await ethers.getContract("NftMarketplace");
  const basicNft = await ethers.getContract("BasicNft");
  console.log(
    `Deleting list for ${basicNft.address} toeken Id ${TOKEN_ID}....`
  );
  const tx = await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID);
  await tx.wait(1);
  console.log("Listing cancelled!");

  if ((network.config.chainId = 31337)) {
    await moveBlocks(2, 1000);
  }
};

cancelItem()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
