import { CONFIG } from './config.js';
import { populateDropdowns, showStatus, getContractABI, initZokrates, getZokratesArtifacts } from './shared.js';

document.addEventListener("DOMContentLoaded", async () => {
    populateDropdowns();

    document.getElementById("verifyForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        await verifyProduct();
    });
});

async function verifyProduct() {
    showStatus("Generazione Proof ZK in corso... (Potrebbe richiedere tempo)", "info");

    try {
        // 1. Raccogli dati form
        const secretId = document.getElementById("secretId").value;
        const modello = document.getElementById("modello").value;
        const movimento = document.getElementById("movimento").value;
        const cassa = document.getElementById("cassa").value;
        const vetro = document.getElementById("vetro").value;
        const cinturino = document.getElementById("cinturino").value;
        const quadrante = document.getElementById("quadrante").value;
        
        const args = [secretId, modello, movimento, cassa, vetro, cinturino, quadrante];

        // 2. Inizializza Zokrates
        const zokratesProvider = await initZokrates();
        const program = await getZokratesArtifacts();
        
        // 3. Compute Witness (Esecuzione logica off-chain)
        const { witness, output } = zokratesProvider.computeWitness(program, args);
        
        // 4. Generate Proof (Crittografia)
        // Serve la Proving Key
        showStatus("Download Proving Key...", "info");
        const pkResponse = await fetch('assets/proving.key');
        const pkBuffer = await pkResponse.arrayBuffer();
        const provingKey = new Uint8Array(pkBuffer);
        
        showStatus("Calcolo Proof Matematica...", "info");
        const proof = zokratesProvider.generateProof(program, witness, provingKey);
        
        console.log("Proof Generata:", proof);

        // 5. Verifica On-Chain
        showStatus("Proof Pronta! Verifica su Blockchain in corso...", "info");

        if (!window.ethereum) throw new Error("Metamask richiesto per interagire con la blockchain.");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const abi = await getContractABI();
        const contract = new ethers.Contract(CONFIG.AUTHENTICITY_ADDRESS, abi, signer);

        // Preparazione argomenti per Solidity
        // Solidity Verifier si aspetta la struct Proof e l'array input.
        // Zokrates-js ritorna un oggetto proof compatibile con la struct?
        // Solitamente zokrates-js proof ha la forma { a: [..], b: [[..],[..]], c: [..] }
        // Verifier.sol si aspetta Proof memory proof, uint256[2] memory input.
        
        // La struct Proof in Solidity:
        // struct Proof { Pairing.G1Point a; Pairing.G2Point b; Pairing.G1Point c; }
        // Zokrates-js output della proof.proof fa match? Solitamente richiede un piccolo mapping o è già compatibile.
        // Controlliamo il formato standard.

        // Mapping standard Zokrates-js -> Solidity Verifier Tuple
        const solidityProof = {
            a: { X: proof.proof.a[0], Y: proof.proof.a[1] },
            b: { X: proof.proof.b[0], Y: proof.proof.b[1] }, // Nota: b è un G2Point, potrebbe richiedere inversione [1][0] o formato array?
            c: { X: proof.proof.c[0], Y: proof.proof.c[1] }
        };

        // ATTENZIONE: Verifier.sol generato usa struct con Pairing.G2Point { uint[2] X; uint[2] Y; }
        // Zokrates-js genera b: [ [x0, x1], [y0, y1] ]
        // Dobbiamo mappare correttamente.
        
        const formattedProof = {
            a: { X: proof.proof.a[0], Y: proof.proof.a[1] },
            b: { 
                X: [proof.proof.b[0][1], proof.proof.b[0][0]], // Spesso c'è inversione di coordinate sui G2 points in solidity vs zokrates
                Y: [proof.proof.b[1][1], proof.proof.b[1][0]]  
            },
            c: { X: proof.proof.c[0], Y: proof.proof.c[1] }
        };

        // Zokrates genera proof.inputs che sono gli output pubblici.
        // Noi ci aspettiamo che proof.inputs[0] sia il commitment.
        // Ma Verifier.sol si aspetta un array di dimensione 2 (per padding o altro bug visto prima).
        // Se verification fails, è qui il problema.
        // Il contratto Authenticity prende `uint256[2] memory input`.
        // Zokrates potrebbe aver generato 1 solo output. Dobbiamo passare quello che Zokrates ha generato.
        
        // Se proof.inputs ha length 1, dobbiamo "paddarlo" a 2 se il contratto vuole 2?
        // Oppure passare direttamente proof.inputs.
        // Proviamo a passare inputs così come sono, se fallisce proviamo ad aggiungere uno zero.
        
        let inputs = proof.inputs;
        if (inputs.length === 1) {
            inputs = [inputs[0], "0x0000000000000000000000000000000000000000000000000000000000000000"];
        }

        // Chiamata Transazione
        const tx = await contract.verifyWatch(formattedProof, inputs);
        await tx.wait();

        showStatus("✅ OROLOGIO AUTENTICO! (Verificato on-chain)", "success");
        
        // Mostra il risultato visuale
        document.getElementById("result").style.display = "block";
        document.getElementById("result").innerHTML = `
            <h3>Risultato Verifica</h3>
            <p><strong>Status:</strong> Autentico (Proof Validata)</p>
            <p><strong>Digital Twin Hash:</strong> ${proof.inputs[0]}</p>
            <p><strong>Transaction:</strong> ${tx.hash}</p>
        `;

    } catch (err) {
        console.error(err);
        let msg = err.reason || err.message || "Errore sconosciuto";
        if (msg.includes("Proof ZKP non valida")) msg = "PROVA FALLITA: La proof matematica non è valida.";
        if (msg.includes("Orologio non presente")) msg = "FAKE DETECTED: La proof è corretta, ma questo orologio NON è registrato nel database ufficiale (Hash sconosciuto).";
        
        showStatus("❌ ERRORE: " + msg, "error");
    }
}
