const hre = require("hardhat");
const fs = require('fs');

async function main() {
    const AUTH_ADDRESS = "0x20AeaAD92207444a11bA6FdD8Ceac6762F02953f"; // Updated contract
    const proofPath = "../zokrates/proof.json";
    
    const proofData = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
    console.log("Proof loaded. Inputs:", proofData.inputs);

    const Authenticity = await hre.ethers.getContractFactory("Authenticity");
    const contract = Authenticity.attach(AUTH_ADDRESS);

    // Try Standard (No Swap)
    try {
        console.log("\n--- Attempt 1: Std Encoding (No Swap) ---");
        const p1 = {
            a: { X: proofData.proof.a[0], Y: proofData.proof.a[1] },
            b: { 
                X: proofData.proof.b[0], 
                Y: proofData.proof.b[1] 
            },
            c: { X: proofData.proof.c[0], Y: proofData.proof.c[1] }
        };
        // Use callStatic to simulate validation without gas
        // Note: verifyWatch is not pure, but we can simulate it.
        // Or just run it. Using estimateGas or staticCall.
        await contract.verifyWatch.staticCall(p1, proofData.inputs);
        console.log("✅ SUCCESS with Standard Encoding!");
        return;
    } catch (e) {
        console.log("❌ Failed Standard:", e.reason || e.message);
        if (e.data) console.log("Revert Data:", e.data);
    }

    // Try Swapped
    try {
        console.log("\n--- Attempt 2: Swapped Encoding ([1][0]) ---");
        const p2 = {
            a: { X: proofData.proof.a[0], Y: proofData.proof.a[1] },
            b: { 
                X: [proofData.proof.b[0][1], proofData.proof.b[0][0]], 
                Y: [proofData.proof.b[1][1], proofData.proof.b[1][0]] 
            },
            c: { X: proofData.proof.c[0], Y: proofData.proof.c[1] }
        };
        await contract.verifyWatch.staticCall(p2, proofData.inputs);
        console.log("✅ SUCCESS with SWAPPED Encoding!");
        return;
    } catch (e) {
        console.log("❌ Failed Swapped:", e.reason || e.message);
    }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
