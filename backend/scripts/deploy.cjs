const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Verifier
  const Verifier = await hre.ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  console.log("Verifier deployed to:", verifier.target);

  // 2. Deploy Authenticity Registry
  const Authenticity = await hre.ethers.getContractFactory("Authenticity");
  const authenticity = await Authenticity.deploy(); 
  await authenticity.waitForDeployment();
  console.log("Authenticity Registry deployed to:", authenticity.target);
  
  // Save ABIs for Frontend
  const fs = require("fs");
  const path = require("path");
  const artifactsDir = path.join(__dirname, "../../frontend/assets");
  
  if (!fs.existsSync(artifactsDir)) {
      // Create recursive just in case, though frontend/assets should exist
      fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const verifierArtifact = await hre.artifacts.readArtifact("Verifier");
  fs.writeFileSync(artifactsDir + "/VerifierABI.json", JSON.stringify(verifierArtifact, null, 2));

  const authArtifact = await hre.artifacts.readArtifact("Authenticity");
  fs.writeFileSync(artifactsDir + "/AuthenticityABI.json", JSON.stringify(authArtifact, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
