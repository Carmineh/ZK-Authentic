import { CONFIG } from './config.js';
import { getContractABI, showStatus } from './shared.js';

document.addEventListener("DOMContentLoaded", async () => {
    // Check Accesso Admin
    if (window.ethereum) {
         try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const abi = await getContractABI();
            const contract = new ethers.Contract(CONFIG.AUTHENTICITY_ADDRESS, abi, provider);
            
            const adminAddr = await contract.admin();
            const userAddr = await signer.getAddress();

            if (adminAddr.toLowerCase() !== userAddr.toLowerCase()) {
                 document.body.innerHTML = "<div class='container'><h1>Accesso Negato</h1><p>Area riservata all'amministratore.</p><a href='index.html'>Torna alla Home</a></div>";
                 return;
            }

            // Load list
            loadProducts(contract);

            // Handle Registration
            document.getElementById("registerForm").addEventListener("submit", async (e) => {
                e.preventDefault();
                // Assicuriamoci di usare una istanza con signer per la scrittura
                const writeContract = contract.connect(signer);
                await registerManualHash(writeContract);
            });

         } catch (e) {
             console.error(e);
         }
    }
});

async function registerManualHash(contract) {
    showStatus("Avvio registrazione...", "info");
    try {
        const hash = document.getElementById("manualHash").value.trim();
        const note = document.getElementById("note").value.trim();

        if (!hash) throw new Error("Inserisci l'hash!");

        showStatus("Firma la transazione su Metamask...", "info");
        // V2 Simple: registerProduct(hash, note)
        const tx = await contract.registerProduct(hash, note);
        showStatus("Transazione inviata...", "info");
        await tx.wait();
        
        showStatus("Successo! Prodotto Registrato.", "success");
        loadProducts(contract); // Refresh list
        
    } catch (e) {
        console.error(e);
        showStatus("Errore: " + e.message, "error");
    }
}

async function loadProducts(contract) {
    const listDiv = document.getElementById("productList");
    listDiv.innerHTML = "<p>Caricamento prodotti...</p>";

    // Fetch events ProductRegistered(uint256, string)
    const filter = contract.filters.ProductRegistered();
    const events = await contract.queryFilter(filter);

    if (events.length === 0) {
        listDiv.innerHTML = "<p>Nessun prodotto registrato.</p>";
        return;
    }

    let html = "<ul style='list-style:none; padding:0;'>";
    for (const ev of events) {
        const hash = ev.args[0];
        const note = ev.args[1];
        html += `
            <li style="background:white; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:5px;">
                <strong>Note:</strong> ${note}<br>
                <small>Hash: ${hash}</small><br>
                <small>Tx: ${ev.transactionHash}</small>
            </li>
        `;
    }
    html += "</ul>";
    listDiv.innerHTML = html;
}
