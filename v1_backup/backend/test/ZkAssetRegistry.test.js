import { expect } from "chai";
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the real proof
const proofPath = path.join(__dirname, "../../zokrates/proof.json");
const proofData = JSON.parse(fs.readFileSync(proofPath, "utf8"));

describe("ZkAssetRegistry System Test", function () {
	let registry, verifier;
	let owner, addr1;

	const { proof, inputs } = proofData;
	const validHash = inputs[0];

	beforeEach(async function () {
		const signers = await hre.ethers.getSigners();
		owner = signers[0];
		addr1 = signers[1];

		const Verifier = await hre.ethers.getContractFactory("Verifier");
		verifier = await Verifier.deploy();
		const verifierAddress = await verifier.getAddress();

		const Registry = await hre.ethers.getContractFactory("ZkAssetRegistry");
		registry = await Registry.deploy(verifierAddress);
	});

	describe("Registration (Database)", function () {
		it("Should allow registering a new hash", async function () {
			await registry.registerItem(validHash);
			const isRegistered = await registry.registeredHashes(validHash);
			expect(isRegistered).to.be.true;
		});

		it("Should emit an event upon registration", async function () {
			// FIX: Updated string to English to match the contract
			await expect(registry.registerItem(validHash))
				.to.emit(registry, "ItemRegistered")
				.withArgs(validHash, "Authentic product registered");
		});
	});

	describe("ZK Verification (Cryptography)", function () {
		it("Should VERIFY successfully a valid and registered proof", async function () {
			await registry.registerItem(validHash);

			const tx = await registry.verifyAuthenticity(proof.a, proof.b, proof.c, inputs);

			await tx.wait();

			await expect(tx).to.emit(registry, "ItemVerified").withArgs(owner.address, validHash);
		});

		it("Should FAIL if the hash has not been registered first", async function () {
			// FIX: Updated string to English to match the contract
			await expect(registry.verifyAuthenticity(proof.a, proof.b, proof.c, inputs)).to.be.revertedWith(
				"Hash not found in Registry!",
			);
		});

		it("Should FAIL if the proof is mathematically incorrect", async function () {
			await registry.registerItem(validHash);

			const fakeInputs = [...inputs];
			fakeInputs[0] = "0x0000000000000000000000000000000000000000000000000000000000000001";

			await expect(registry.verifyAuthenticity(proof.a, proof.b, proof.c, fakeInputs)).to.be.reverted;
		});
	});
});
