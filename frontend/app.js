const API_URL = "http://localhost:3000";

async function registerProduct() {
	const hash = document.getElementById("hashInput").value.trim();
	const statusBox = document.getElementById("registerStatus");

	if (!hash) {
		showStatus(statusBox, "Please enter a valid hash.", "error");
		return;
	}

	showStatus(statusBox, "Registering on blockchain...", "loading");

	try {
		const response = await fetch(`${API_URL}/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ itemHash: hash }),
		});

		const data = await response.json();

		if (data.success) {
			showStatus(statusBox, `Registered. Tx: ${data.txHash}`, "success");
		} else {
			showStatus(statusBox, `Error: ${data.error}`, "error");
		}
	} catch (error) {
		showStatus(statusBox, `Connection error: ${error.message}`, "error");
	}
}

// --- FUNZIONE 2: VERIFICA ---
async function verifyProduct() {
	const fileInput = document.getElementById("proofFile");
	const statusBox = document.getElementById("verifyStatus");

	if (fileInput.files.length === 0) {
		showStatus(statusBox, "Select the proof.json file first.", "error");
		return;
	}

	showStatus(statusBox, "Reading file and verifying...", "loading");

	const file = fileInput.files[0];
	const reader = new FileReader();

	reader.onload = async function (e) {
		try {
			// 1. Leggiamo il JSON dal file caricato
			const proofData = JSON.parse(e.target.result);

			// 2. Inviamo al backend
			const response = await fetch(`${API_URL}/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(proofData),
			});

			const data = await response.json();

			if (data.verified) {
				showStatus(statusBox, `AUTHENTIC. Verified on-chain.\nTx: ${data.txHash}`, "success");
			} else {
				showStatus(statusBox, `NOT AUTHENTIC or error: ${data.error}`, "error");
			}
		} catch (error) {
			console.error(error);
			showStatus(statusBox, "Invalid JSON file or server offline.", "error");
		}
	};

	reader.readAsText(file);
}

// Funzione helper per mostrare messaggi
function showStatus(element, message, type) {
	element.className = `status-box ${type}`;
	element.innerText = message;
	element.style.display = "block";
}
