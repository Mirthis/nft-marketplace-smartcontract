const { network } = require("hardhat");

const sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

const moveBlocks = async (amount, sleepAmount = 0) => {
  for (let index = 0; index < amount; index++) {
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
    if (sleepAmount) {
      console.log(`Sleeping for ${sleepAmount} milliseconds`);
      await sleep(sleepAmount);
    }
  }
};

module.exports = {
  moveBlocks,
  sleep,
};
