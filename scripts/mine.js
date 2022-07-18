const { moveBlocks } = require("../utils/moveBlocks");

const mine = async () => {
  if (network.config.chainId === 31337) {
    await moveBlocks(2, 1000);
  }
};

mine()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
