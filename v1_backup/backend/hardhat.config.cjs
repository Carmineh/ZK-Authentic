require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    firefly: {
      url: "http://127.0.0.1:5100", // Firefly Geth RPC Port
      accounts: [
         "6758bf0e4ab4a150a4343ac243eadc19a336ac3c26f02a1d751df8619a4efcb8" // DIO Admin Private Key
      ]
    },
  },
};
