import { CONFIG } from './config.js';
import { getContractABI } from './shared.js';

document.addEventListener("DOMContentLoaded", async () => {
    // Check se già connesso
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            handleLogin(accounts[0]);
        }
        
        // Auto-reload on account change
        window.ethereum.on('accountsChanged', (accts) => {
            if (accts.length > 0) handleLogin(accts[0]);
            else window.location.reload();
        });
    }

    document.getElementById("connectBtn").addEventListener("click", async () => {
        if (!window.ethereum) return alert("Installa Metamask!");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        handleLogin(accounts[0]);
    });
});

async function handleLogin(userAddress) {
    document.getElementById("connectBtn").style.display = "none";
    document.getElementById("userInfo").style.display = "block";
    document.getElementById("userAddress").innerText = userAddress;

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const abi = await getContractABI();
        const contract = new ethers.Contract(CONFIG.AUTHENTICITY_ADDRESS, abi, provider);
        const adminAddr = await contract.admin();

        const roleBadge = document.getElementById("roleBadge");
        
        if (userAddress.toLowerCase() === adminAddr.toLowerCase()) {
            roleBadge.innerText = "ADMIN";
            roleBadge.className = "role-badge badge-admin";
            document.getElementById("adminMenu").style.display = "grid";
        } else {
            roleBadge.innerText = "USER / AUDITOR";
            roleBadge.className = "role-badge badge-user";
            document.getElementById("userMenu").style.display = "grid";
            // Opzionale: redirect immediato
            // window.location.href = 'verify.html'; 
        }

    } catch (e) {
        console.error(e);
        alert("Errore caricamento contratto. Sei sulla rete giusta?");
    }
}
