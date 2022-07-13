const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/moveBlocks");

const TOKEN_ID = 3;

const cancelItem = async () => {
  const nftMarketplace = await ethers.getContract("NftMarketplace");
  const basicNft = await ethers.getContract("BasicNft");
  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
  const price = listing.price.toString();
  console.log(
    `Buying nft at ${basicNft.address} toeken Id ${TOKEN_ID} for ${price}....`
  );
  const tx = await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
    value: price,
  });
  await tx.wait(1);
  console.log("Item bought!");

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
