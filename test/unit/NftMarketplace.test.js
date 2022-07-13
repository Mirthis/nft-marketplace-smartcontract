const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Nft Marketplace Unit Tests", function () {
      let nftMarketplace, nftMarketplaceContract, basicNft, basicNftContract;
      const PRICE = ethers.utils.parseEther("0.1");
      const TOKEN_ID = 0;

      beforeEach(async () => {
        const signers = await ethers.getSigners();
        deployer = signers[0];
        user = signers[1];

        // console.log("Deployer:");
        // console.log(deployer);
        // console.log("User:");
        // console.log(user);

        await deployments.fixture(["all"]);
        nftMarketplace = await ethers.getContract("NftMarketplace");
        basicNft = await ethers.getContract("BasicNft");
        await basicNft.mintNft();
        await basicNft.approve(nftMarketplace.address, TOKEN_ID);
      });

      describe("listItem", function () {
        it("list an item", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          const listing = await nftMarketplace.getListing(
            basicNft.address,
            TOKEN_ID
          );
          assert.equal(listing.price.toString(), PRICE.toString());
          assert.equal(listing.seller, deployer.address);
        });

        it("emit an event after listing", async () => {
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.emit(nftMarketplace, "ItemListed");
        });

        it("revert if item already listed", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NftAlreadyListed");
        });

        it("only allow the owner to list an item", async () => {
          const nftMarketPlaceUser = await nftMarketplace.connect(user);
          await expect(
            nftMarketPlaceUser.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NotOwner");
        });

        it("only allow listing with price higher than 0", async () => {
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
          ).to.be.revertedWith("NftMarketplace__PriceMustBeGreaterThanZero");
        });

        it("only allow listing of approved nfts", async () => {
          await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID);

          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NftMarketplace__NotApprovedForMarketplace");
        });
      });

      describe("buyITem", () => {
        beforeEach(async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
        });

        it("update seller proceeds", async () => {
          const nftMarketPlaceUser = await nftMarketplace.connect(user);
          await nftMarketPlaceUser.buyItem(basicNft.address, TOKEN_ID, {
            value: PRICE,
          });
          const proceeds = await nftMarketplace.getProceeds(deployer.address);
          assert.equal(proceeds.toString(), PRICE.toString());
        });

        it("remove listing", async () => {
          const nftMarketPlaceUser = await nftMarketplace.connect(user);
          await nftMarketPlaceUser.buyItem(basicNft.address, TOKEN_ID, {
            value: PRICE,
          });
          const listing = await nftMarketplace.getListing(
            basicNft.address,
            TOKEN_ID
          );
          assert.equal(listing.price.toString(), "0");
          assert.equal(listing.seller, ethers.constants.AddressZero);
        });

        it("emit an event after transfer is complete", async () => {
          const nftMarketPlaceUser = await nftMarketplace.connect(user);
          await expect(
            nftMarketPlaceUser.buyItem(basicNft.address, TOKEN_ID, {
              value: PRICE,
            })
          ).to.emit(nftMarketplace, "ItemSold");
        });

        it("only allow buying listed nft", async () => {
          const nftMarketPlaceUser = await nftMarketplace.connect(user);
          await expect(
            nftMarketPlaceUser.buyItem(basicNft.address, 1, {
              value: PRICE,
            })
          ).to.be.revertedWith("NftMarketplace__NftNotListed");
        });

        it("faif if price is lower than listed price", async () => {
          const nftMarketPlaceUser = await nftMarketplace.connect(user);
          await expect(
            nftMarketPlaceUser.buyItem(basicNft.address, TOKEN_ID, {
              value: 0,
            })
          ).to.be.revertedWith("NftMarketplace__PriceNotMet");
        });
      });

      describe("cancel listing", () => {
        beforeEach(async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
        });

        it("remove the listing", async () => {
          await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID);
          const listing = await nftMarketplace.getListing(
            basicNft.address,
            TOKEN_ID
          );
          assert.equal(listing.price.toString(), "0");
          assert.equal(listing.seller, ethers.constants.AddressZero);
        });

        it("emit an event", async () => {
          await expect(
            nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
          ).to.emit(nftMarketplace, "ItemCancelled");
        });

        it("revert if item is not listed", async () => {
          await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
            value: PRICE,
          });
          await expect(
            nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("NftMarketplace__NftNotListed");
        });

        it("can only be cancelled by the owner", async () => {
          const nftMarketPlaceUser = await nftMarketplace.connect(user);
          await expect(
            nftMarketPlaceUser.cancelListing(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("NftMarketplace__NotOwner");
        });
      });

      describe("update listing", () => {
        const newPrice = ethers.utils.parseEther("0.2");

        beforeEach(async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
        });

        it("update the listing", async () => {
          await nftMarketplace.updateListing(
            basicNft.address,
            TOKEN_ID,
            newPrice
          );

          const listing = await nftMarketplace.getListing(
            basicNft.address,
            TOKEN_ID
          );
          assert.equal(listing.price.toString(), newPrice.toString());
        });

        it("emit an event", async () => {
          await expect(
            nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
          ).to.emit(nftMarketplace, "ItemListed");
        });

        it("revert if item is not listed", async () => {
          await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
            value: PRICE,
          });
          await expect(
            nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
          ).to.be.revertedWith("NftMarketplace__NftNotListed");
        });

        it("can only be cancelled by the owner", async () => {
          const nftMarketPlaceUser = await nftMarketplace.connect(user);
          await expect(
            nftMarketPlaceUser.updateListing(
              basicNft.address,
              TOKEN_ID,
              newPrice
            )
          ).to.be.revertedWith("NftMarketplace__NotOwner");
        });
      });

      describe("withdrawProceeds", () => {
        beforeEach(async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          const nftMarketPlaceUser = await nftMarketplace.connect(user);
          await nftMarketPlaceUser.buyItem(basicNft.address, TOKEN_ID, {
            value: PRICE,
          });
        });

        it("set the proceeds due to 0", async () => {
          await nftMarketplace.withdrawProceeds();
          const proceeds = await nftMarketplace.getProceeds(deployer.address);
          assert.equal(proceeds.toString(), "0");
        });

        it("sends the procees to the seller", async () => {
          const sellerBalanceStart = await deployer.getBalance();
          const txResponse = await nftMarketplace.withdrawProceeds();
          const transactionReceipt = await txResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const sellerBalanceEnd = await deployer.getBalance();

          assert.equal(
            sellerBalanceEnd.add(gasCost).toString(),
            sellerBalanceStart.add(PRICE).toString()
          );
        });

        it("fails if proceeds are not greater than 0", async () => {
          await nftMarketplace.withdrawProceeds();
          await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
            "NftMarketplace__NoProceeds"
          );
        });
      });
    });
