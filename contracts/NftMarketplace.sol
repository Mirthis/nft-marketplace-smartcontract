// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

error NftMarketplace__PriceMustBeGreaterThanZero();
error NftMarketplace__NotApprovedForMarketplace();
error NftMarketplace__NftAlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NftNotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__PriceNotMet(
  address nftAddress,
  uint256 tokenId,
  uint256 itemPrice
);
error NftMarketplace__NotOwner();
error NftMarketplace__NoProceeds();
error NftMarketplace__ProceedsWithdrawFailed();

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NftMarketplace is ReentrancyGuard {
  struct Listing {
    uint256 price;
    address seller;
  }

  // NFT Contract Address -> NFT TokenId -> Listing
  mapping(address => mapping(uint256 => Listing)) private s_listings;

  // Seller address => amount earner
  mapping(address => uint256) private s_proceeds;

  event ItemListed(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );

  event ItemSold(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );

  event ItemCanceled(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId
  );

  ////////////////////////////
  /// Modifiers            ///
  ////////////////////////////

  modifier notListed(address nftAddress, uint256 tokenId) {
    Listing memory listing = s_listings[nftAddress][tokenId];
    if (listing.price > 0) {
      revert NftMarketplace__NftAlreadyListed(nftAddress, tokenId);
    }
    _;
  }

  modifier isListed(address nftAddress, uint256 tokenId) {
    Listing memory listing = s_listings[nftAddress][tokenId];
    if (listing.price <= 0) {
      revert NftMarketplace__NftNotListed(nftAddress, tokenId);
    }
    _;
  }

  modifier isOwner(
    address nftAddress,
    uint256 tokenId,
    address seller
  ) {
    IERC721 nft = IERC721(nftAddress);
    address owner = nft.ownerOf(tokenId);
    if (seller != owner) {
      revert NftMarketplace__NotOwner();
    }
    _;
  }

  ////////////////////////////
  /// Main functions       ///
  ////////////////////////////

  /*
   * @notice Method for listing NFT
   * @param nftAddress Address of NFT contract
   * @param tokenId Token ID of NFT
   * @param price sale price for each item
   */
  function listItem(
    address nftAddress,
    uint256 tokenId,
    uint256 price
  )
    external
    notListed(nftAddress, tokenId)
    isOwner(nftAddress, tokenId, msg.sender)
  {
    if (price <= 0) revert NftMarketplace__PriceMustBeGreaterThanZero();

    // create interface for the specified nft address
    IERC721 nft = IERC721(nftAddress);
    // Check the Marketplace has approval for the specific nft contract and token
    if (nft.getApproved(tokenId) != address(this)) {
      revert NftMarketplace__NotApprovedForMarketplace();
    }

    s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
    emit ItemListed(msg.sender, nftAddress, tokenId, price);
  }

  /*
   * @notice Method for buying listing
   * @notice The owner of an NFT could unapprove the marketplace,
   * which would cause this function to fail
   * Ideally you'd also have a `createOffer` functionality.
   * @param nftAddress Address of NFT contract
   * @param tokenId Token ID of NFT
   */
  function buyItem(address nftAddress, uint256 tokenId)
    external
    payable
    isListed(nftAddress, tokenId)
    nonReentrant
  {
    Listing memory listing = s_listings[nftAddress][tokenId];
    if (msg.value < listing.price) {
      revert NftMarketplace__PriceNotMet(nftAddress, tokenId, listing.price);
    }
    s_proceeds[listing.seller] = s_proceeds[listing.seller] + msg.value;
    delete s_listings[nftAddress][tokenId];
    IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);
    emit ItemSold(msg.sender, nftAddress, tokenId, listing.price);
  }

  /*
   * @notice Method for cancelling listing
   * @param nftAddress Address of NFT contract
   * @param tokenId Token ID of NFT
   */
  function cancelListing(address nftAddress, uint256 tokenId)
    external
    isOwner(nftAddress, tokenId, msg.sender)
    isListed(nftAddress, tokenId)
  {
    delete (s_listings[nftAddress][tokenId]);
    emit ItemCanceled(msg.sender, nftAddress, tokenId);
  }

  /*
   * @notice Method for updating listing
   * @param nftAddress Address of NFT contract
   * @param tokenId Token ID of NFT
   * @param newPrice Price in Wei of the item
   */
  function updateListing(
    address nftAddress,
    uint256 tokenId,
    uint256 newPrice
  )
    external
    isListed(nftAddress, tokenId)
    nonReentrant
    isOwner(nftAddress, tokenId, msg.sender)
  {
    s_listings[nftAddress][tokenId].price = newPrice;
    emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
  }

  /*
   * @notice Method for withdrawing proceeds from sales
   */
  function withdrawProceeds() external {
    uint256 proceeds = s_proceeds[msg.sender];
    if (proceeds <= 0) {
      revert NftMarketplace__NoProceeds();
    }
    s_proceeds[msg.sender] = 0;
    (bool success, ) = payable(msg.sender).call{value: proceeds}("");
    if (!success) {
      revert NftMarketplace__ProceedsWithdrawFailed();
    }
  }

  ///////////////////////////
  /// Getter Functions      ///
  /////////////////////////////
  function getListing(address nftAddress, uint256 tokenId)
    external
    view
    returns (Listing memory)
  {
    return s_listings[nftAddress][tokenId];
  }

  function getProceeds(address seller) external view returns (uint256) {
    return s_proceeds[seller];
  }
}
