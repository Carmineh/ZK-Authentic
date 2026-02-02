const hre = require("hardhat");

async function main() {
  // Hardcoded for reliability
  const receiver = "0x6105aeB85F1d7899FAFCdC99302C0b2515EE27fb";

  const [sender] = await hre.ethers.getSigners();
  console.log(`Sending ETH from ${sender.address} to ${receiver}`);

  const tx = await sender.sendTransaction({
    to: receiver,
    value: hre.ethers.parseEther("10.0")
  });
  
  await tx.wait();
  console.log(`Transferred 10 ETH! TX: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
