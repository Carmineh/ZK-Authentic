const hre = require("hardhat");

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
      console.log("Usage: node register_product.cjs <DigitalTwinHash> <Note>");
      console.log("Example: node register_product.cjs 1234567890 \"Rolex Submariner 2024\"");
      return;
  }

  // Force BigInt to handle large uint256 values correctly
  const hash = BigInt(args[0]); 
  const note = args[1] || "Registered via CLI";

  console.log(`Registering Product Hash: ${hash}`);
  
  // Indirizzo del contratto deployato
  const AUTH_ADDRESS = "0x449d3C36635749a62ab01F8719DFfC13D6033CCc";

  const Authenticity = await hre.ethers.getContractFactory("Authenticity");
  const contract = Authenticity.attach(AUTH_ADDRESS);

  // Usiamo il signer di default (Admin)
  const [admin] = await hre.ethers.getSigners();
  console.log(`Sending transaction from: ${admin.address}`);

  const tx = await contract.connect(admin).registerProduct(hash, note);
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log("✅ Product Registered Successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
