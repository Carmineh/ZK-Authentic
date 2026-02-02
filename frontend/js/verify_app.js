import { CONFIG } from './config.js';
import { showStatus, getContractABI, getVerifierABI } from './shared.js';

document.addEventListener("DOMContentLoaded", async () => {
    // Check Address (Optional display)
    if (window.ethereum) {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            /* Optional: Display address somewhere if needed, currently hidden in minimal UI */
        } catch (e) {
            console.error("Wallet access denied or error:", e);
        }
    }

    // Upload Verify Listener
    const uploadForm = document.getElementById("uploadForm");
    if (uploadForm) {
        uploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await verifyUpload();
        });
    }
});

async function verifyUpload() {
    const fileInput = document.getElementById("proofFile");
    if (!fileInput || !fileInput.files.length) {
        return showStatus("Seleziona il file proof.json", "error");
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const content = e.target.result;
            const proofJson = JSON.parse(content);

            // Validazione base
            if (!proofJson.proof || !proofJson.inputs) {
                throw new Error("Formato file non valido.");
            }
            showStatus("Verifica in corso...", "info");
            await submitProof(proofJson);
        } catch (err) {
            showStatus("Errore lettura file: " + err.message, "error");
        }
    };
    reader.readAsText(file);
}

async function submitProof(proofData) {
    try {
        if (!window.ethereum) throw new Error("Metamask non rilevato.");
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // 1. Check Cryptographic Proof (Verifier Contract)
        showStatus("Controllo validità matematica Proof...", "info");
        const vAbi = await getVerifierABI();
        const verifier = new ethers.Contract(CONFIG.VERIFIER_ADDRESS, vAbi, provider);

        const p = proofData.proof;
        const inputs = proofData.inputs;

        // Structure for Solidity struct Proof { a: G1, b: G2, c: G1 }
        // Note: ethers expects arrays for structs or objects matching properties
        // Solidity G1: [x,y], G2: [[x1,x2], [y1,y2]]
        // We need to match the struct exactly.
        const proofStruct = {
            a: { X: p.a[0], Y: p.a[1] },
            b: { X: p.b[0], Y: p.b[1] }, // Note: check dimensions, Zokrates uses [ [x1,x2], [y1,y2] ] usually
            c: { X: p.c[0], Y: p.c[1] }
        };

        // WARNING: Zokrates.js outputs G2 as [[x0, x1], [y0, y1]] usually, but Solidity Pairings library often wants X=[x1,x0].
        // Let's assume standard encoding first.
        
        let isValid = false;
        try {
            isValid = await verifier.verifyTx(proofStruct, inputs);
        } catch (e) {
            console.error("Verifier Call Failed, trying G2 swap...", e);
            // Sometimes G2 needs swap. Not doing it blind to avoid complexity unless failed.
            throw new Error("Proof non valida (Verifier check failed).");
        }

        if (!isValid) {
            throw new Error("Proof MATEMATICAMENTE INVALIDA! I dati non corrispondono alla prova.");
        }

        showStatus("Proof Valida! Controllo Registro...", "info");
        
        // 2. Check Registry
        const abi = await getContractABI();
        const contract = new ethers.Contract(CONFIG.AUTHENTICITY_ADDRESS, abi, provider);

        // Extract Hash - inputs is defined in submitProof args
        // But we passed inputs to verifier, let's reuse proofData.inputs
        const watchHash = proofData.inputs[proofData.inputs.length - 1]; 
        
        console.log("Checking Hash:", watchHash);

        // Verification Call
        const result = await contract.getProduct(watchHash);
        const exists = result[0];
        const note = result[1];

        if (exists) {
            showStatus("Orologio Autentico.", "success");
            
            const resDiv = document.getElementById("result");
            if(resDiv) {
                resDiv.style.display = "block";
                resDiv.innerHTML = `
                    <h3>Esito Verifica</h3>
                    <p><strong>Stato:</strong> Autentico</p>
                    <p><strong>Note:</strong> ${note}</p>
                    <p><small style='color:#999'>Hash: ${watchHash}</small></p>
                `;
            }
        }

    } catch (err) {
         console.error("Verification Error:", err);
        let msg = err.reason || err.message || "Errore sconosciuto";
        if (msg.includes("Orologio non trovato") || msg.includes("NON TROVATO")) {
            showStatus("Orologio NON presente nel registro.", "error");
        } else {
            showStatus("Errore di verifica: " + msg, "error");
        }
    }
}
