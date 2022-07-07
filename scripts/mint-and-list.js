const { ethers } = require("hardhat");

const PRICE = ethers.utils.parseEther("0.1");

const mintAndList = async () => {
  const nftMarketplace = await ethers.getContract("NftMarketplace");
  const basicNft = await ethers.getContract("BasicNft");
  console.log("Minting BasicNft....");
  const mintTx = await basicNft.mintNft();
  const mintTxReceipt = await mintTx.wait(1);
  const tokenId = mintTxReceipt.events[0].args.tokenId;
  console.log(`Nft minted with token id ${tokenId}!`);
  console.log("Approving Nft...");
  const approveTx = await basicNft.approve(nftMarketplace.address, tokenId);
  await approveTx.wait(1);
  console.log("Nft approved!");
  console.log("Listing nft on market place...");
  const listTx = await nftMarketplace.listItem(
    basicNft.address,
    tokenId,
    PRICE
  );
  await listTx.wait(1);
  console.log("Nft listed");
};

mintAndList()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
