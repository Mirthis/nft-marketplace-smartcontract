const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/moveBlocks");

const mint = async () => {
  const nftMarketplace = await ethers.getContract("NftMarketplace");
  const basicNft = await ethers.getContract("BasicNft");
  console.log("Minting BasicNft....");
  const mintTx = await basicNft.mintNft();
  const mintTxReceipt = await mintTx.wait(1);
  const tokenId = mintTxReceipt.events[0].args.tokenId;
  console.log(
    `Nft minted with token id ${tokenId}, address: ${basicNft.address}`
  );

  if ((network.config.chainId = 31337)) {
    await moveBlocks(2, 1000);
  }
};

mint()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
