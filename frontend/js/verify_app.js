import { CONFIG } from './config.js';
import { populateDropdowns, showStatus, getContractABI, initZokrates, getZokratesArtifacts } from './shared.js';

document.addEventListener("DOMContentLoaded", async () => {
    populateDropdowns();
    
    // Mostra link admin se autorizzato
    if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        document.getElementById("addressDisplay").innerText = address.substring(0, 6) + "..." + address.substring(38);
        
        // Check rapido ruolo per mostrare link
        const abi = await getContractABI();
        const contract = new ethers.Contract(CONFIG.AUTHENTICITY_ADDRESS, abi, provider);
        const admin = await contract.admin();
        if (address.toLowerCase() === admin.toLowerCase()) {
            document.getElementById("adminLink").style.display = "inline";
        }
    }

    // Manual Verify
    document.getElementById("verifyForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        await verifyManual();
    });

    // Upload Verify
    document.getElementById("uploadForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        await verifyUpload();
    });
});

async function verifyManual() {
    showStatus("Generazione Proof ZK in corso...", "info");
    try {
        const secretId = document.getElementById("secretId").value;
        const modello = document.getElementById("modello").value;
        const movimento = document.getElementById("movimento").value;
        const cassa = document.getElementById("cassa").value;
        const vetro = document.getElementById("vetro").value;
        const cinturino = document.getElementById("cinturino").value;
        const quadrante = document.getElementById("quadrante").value;
        const args = [secretId, modello, movimento, cassa, vetro, cinturino, quadrante];

        const zokratesProvider = await initZokrates();
        const program = await getZokratesArtifacts();
        const { witness, output } = zokratesProvider.computeWitness(program, args);
        
        const pkResponse = await fetch('assets/proving.key');
        const pkBuffer = await pkResponse.arrayBuffer();
        const provingKey = new Uint8Array(pkBuffer);
        
        const proof = zokratesProvider.generateProof(program, witness, provingKey);
        await submitProof(proof); // Riutilizziamo la funzione di submit
    } catch (err) {
        console.error(err);
        showStatus("Errore generazione manuale: " + err.message, "error");
    }
}

async function verifyUpload() {
    const fileInput = document.getElementById("proofFile");
    if (!fileInput.files.length) return showStatus("Seleziona un file json!", "error");
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const proofJson = JSON.parse(e.target.result);
            // Validazione base
            if (!proofJson.proof || !proofJson.inputs) {
                throw new Error("Formato proof.json non valido. Manca 'proof' o 'inputs'.");
            }
            showStatus("File caricato. Verifica on-chain...", "info");
            await submitProof(proofJson);
        } catch (err) {
            showStatus("Errore file: " + err.message, "error");
        }
    };
    reader.readAsText(file);
}

async function submitProof(proofData) {
    try {
        if (!window.ethereum) throw new Error("Wallet non connesso");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const abi = await getContractABI();
        const contract = new ethers.Contract(CONFIG.AUTHENTICITY_ADDRESS, abi, signer);

        // Formattazione Proof per Solidity
        // NOTA: Zokrates.js solitamente ritorna [x, y], ma Solidity struct G2Point è [x, y].
        // A volte c'è bisogno di swap [1][0].
        // Proviamo la versione SENZA swap se quella con swap falliva, o viceversa.
        // In base all'errore persistente, proviamo lo standard diretto.
        
        const formattedProof = {
            a: { X: proofData.proof.a[0], Y: proofData.proof.a[1] },
            b: { 
                X: proofData.proof.b[0], // Direct mapping [x0, x1]
                Y: proofData.proof.b[1]  // Direct mapping [y0, y1]
            },
            c: { X: proofData.proof.c[0], Y: proofData.proof.c[1] }
        };

        // Gestione Inputs
        // Assicuriamoci che siano stringhe hex o decimali valide
        let inputs = proofData.inputs;
        if (inputs.length === 1) {
             inputs = [inputs[0], "0x0000000000000000000000000000000000000000000000000000000000000000"];
        }

        console.log("Submitting Proof:", formattedProof, " Inputs:", inputs);

        // Aggiungiamo gasLimit manuale per vedere l'errore reale se revert
        const tx = await contract.verifyWatch(formattedProof, inputs, { gasLimit: 5000000 });
        showStatus("Transazione inviata. Attesa conferma...", "info");
        await tx.wait();

        showStatus("✅ PROOF VALIDA e OROLOGIO AUTENTICO!", "success");
        document.getElementById("result").style.display = "block";
        document.getElementById("result").innerHTML = `
            <h3>Risultato</h3>
            <p>Hash Digital Twin: ${proofData.inputs[0]}</p>
            <p>Tx Verificata: ${tx.hash}</p>
        `;

    } catch (err) {
         console.error(err);
        let msg = err.reason || err.message || "Errore sconosciuto";
        if (msg.includes("Proof ZKP non valida")) msg = "PROVA FALSIFICATA o ERRATA.";
        if (msg.includes("Orologio non presente")) msg = "FAKE DETECTED: Proof valida ma hash non registrato.";
        showStatus("❌ ERRORE VERIFICA: " + msg, "error");
    }
}
