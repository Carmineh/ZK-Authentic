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
    statusDiv.innerHTML = message;
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Carica l'ABI del contratto
export async function getContractABI() {
    const response = await fetch('assets/AuthenticityABI.json');
    const json = await response.json();
    return json.abi;
}

export async function getVerifierABI() {
    const response = await fetch('assets/VerifierABI.json');
    const json = await response.json();
    return json.abi;
}
