import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { createRequire } from "module";

import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment configuration
dotenv.config();
const require = createRequire(import.meta.url);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../frontend")));

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:5100";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;

if (!PRIVATE_KEY || !REGISTRY_ADDRESS) {
	console.error("Error: PRIVATE_KEY and REGISTRY_ADDRESS must be defined in .env file");
	process.exit(1);
}

// Load ABI
const registryArtifact = require("./abis/ZkAssetRegistry.json");
const registryABI = registryArtifact.abi;

// Blockchain connection
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const registryContract = new ethers.Contract(REGISTRY_ADDRESS, registryABI, wallet);

console.log("Connected to Firefly. Wallet:", wallet.address);

// --- ROUTE 1: REGISTRATION (Hash only) ---
app.post("/register", async (req, res) => {
	try {
		const { itemHash } = req.body;
		console.log(`Brand registering hash: ${itemHash}...`);

		const tx = await registryContract.registerItem(itemHash);
		await tx.wait();

		console.log("Item registered on blockchain!");
		res.json({ success: true, txHash: tx.hash });
	} catch (error) {
		console.error("Register error:", error);
		res.status(500).json({ error: error.message });
	}
});

// --- ROUTE 2: VERIFICATION (Complete Proof) ---
app.post("/verify", async (req, res) => {
	try {
		console.log("ZK verification request received...");
		const { proof, inputs } = req.body;

		const tx = await registryContract.verifyAuthenticity(proof.a, proof.b, proof.c, inputs);

		console.log("Verification in progress...");
		const receipt = await tx.wait();

		console.log("VERIFICATION SUCCESSFUL! Block:", receipt.blockNumber);
		res.json({ success: true, verified: true, txHash: tx.hash });
	} catch (error) {
		console.error("Verification error:", error);
		res.status(500).json({ error: error.reason || error.message });
	}
});

// --- ROUTE 3: EVENT HISTORY ---
app.get("/history", async (req, res) => {
	try {
		const registerFilter = registryContract.filters.ItemRegistered();
		const registerEvents = await registryContract.queryFilter(registerFilter);

		const verifyFilter = registryContract.filters.ItemVerified();
		const verifyEvents = await registryContract.queryFilter(verifyFilter);
		const history = {
			registrations: registerEvents.map((e) => ({
				hash: e.args[0].toString(),
				note: e.args[1],
				block: e.blockNumber.toString(),
				tx: e.transactionHash,
			})),
			verifications: verifyEvents.map((e) => ({
				verifier: e.args[0],
				hash: e.args[1].toString(),
				block: e.blockNumber.toString(),
				tx: e.transactionHash,
			})),
		};

		res.json(history);
	} catch (error) {
		console.error("History error:", error);
		res.status(500).json({ error: "Error retrieving blockchain data" });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server ready on http://localhost:${PORT}`);
});
