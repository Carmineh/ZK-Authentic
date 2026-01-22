require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
	solidity: {
		version: "0.8.20",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		firefly: {
			url: process.env.RPC_URL || "http://127.0.0.1:5100",
			accounts: [process.env.PRIVATE_KEY],
		},
	},
};
