async function main() {
	const [deployer] = await ethers.getSigners();

	console.log("Deploying with address:", deployer.address);

	// Deploy Verifier
	const Verifier = await ethers.getContractFactory("Verifier");
	const verifier = await Verifier.deploy();
	await verifier.waitForDeployment();
	console.log("Verifier deployed at:", await verifier.getAddress());

	// Deploy ZkAssetRegistry with Verifier address
	const ZkAssetRegistry = await ethers.getContractFactory("ZkAssetRegistry");
	const zkAssetRegistry = await ZkAssetRegistry.deploy(await verifier.getAddress());
	await zkAssetRegistry.waitForDeployment();
	console.log("ZkAssetRegistry deployed at:", await zkAssetRegistry.getAddress());
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
