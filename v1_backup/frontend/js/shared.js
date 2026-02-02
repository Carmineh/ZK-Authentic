import { CONFIG } from './config.js';

// Funzione per popolare le select
export function populateDropdowns() {
    for (const [key, values] of Object.entries(CONFIG.CONSTANTS)) {
        const selectId = key.toLowerCase();
        const select = document.getElementById(selectId);
        if (select) {
            for (const [val, label] of Object.entries(values)) {
                const option = document.createElement("option");
                option.value = val;
                option.innerText = label;
                select.appendChild(option);
            }
        }
    }
}

// Funzione per mostrare messaggi di stato
export function showStatus(message, type = "info") {
    const statusDiv = document.getElementById("status");
    if (!statusDiv) return;
    
    statusDiv.style.display = "block";
    statusDiv.className = type === "error" ? "error" : "success";
    statusDiv.innerText = message;
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Carica l'ABI del contratto
export async function getContractABI() {
    const response = await fetch('assets/AuthenticityABI.json');
    const json = await response.json();
    return json.abi;
}

// Inizializza Zokrates
export async function initZokrates() {
    try {
        // window.zokrates è esposto dallo script UMD
        // A volte può essere 'Zokrates' con la maiuscola o non caricato
        const zokrates = window.zokrates || window.Zokrates;
        
        if (!zokrates) {
            console.error("Window Zokrates keys:", Object.keys(window).filter(k => k.toLowerCase().includes("zok")));
            throw new Error("Libreria Zokrates non trovata! Verifica la connessione internet.");
        }

        const zokratesProvider = await zokrates.initialize();
        return zokratesProvider;
    } catch (e) {
        console.error("Zokrates init failed:", e);
        throw e;
    }
}

// Legge il file binario compilato 'out'
export async function getZokratesArtifacts() {
    const response = await fetch('assets/out');
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer); // restituisce il programma compilato come array di byte
}
