const hre = require("hardhat");

async function main() {
  console.log("Starting deployment to Firefly/Localhost...");

  // 1. Deploy Verifier
  const Verifier = await hre.ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`Verifier deployed to: ${verifierAddress}`);

  // 2. Deploy Authenticity
  const Authenticity = await hre.ethers.getContractFactory("Authenticity");
  const authenticity = await Authenticity.deploy(verifierAddress);
  await authenticity.waitForDeployment();
  const authAddress = await authenticity.getAddress();
  console.log(`Authenticity deployed to: ${authAddress}`);

  console.log("Deployment Complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
