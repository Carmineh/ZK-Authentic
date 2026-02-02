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

// --- FUNCTION 2: VERIFICATION ---
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
			// 1. Read JSON from uploaded file
			const proofData = JSON.parse(e.target.result);

			// 2. Send to backend
			const response = await fetch(`${API_URL}/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(proofData),
			});

			const data = await response.json();

			if (data.verified) {
				showStatus(statusBox, `AUTHENTIC. Verified on-chain.\nTx: ${data.txHash}`, "success");
			} else {
				showStatus(statusBox, "NOT AUTHENTIC. Invalid proof.", "error");
			}
		} catch (error) {
			console.error(error);
			showStatus(statusBox, "NOT AUTHENTIC. Invalid proof.", "error");
		}
	};

	reader.readAsText(file);
}

async function loadHistory() {
	const regList = document.getElementById("registrationsList");
	const verList = document.getElementById("verificationsList");

	try {
		const response = await fetch(`${API_URL}/history`);
		const data = await response.json();

		// Clear lists
		regList.innerHTML = "";
		verList.innerHTML = "";

		// Fill Registrations
		if (data.registrations.length === 0) {
			regList.innerHTML = "<li>No data found.</li>";
		} else {
			// Sort by most recent (reverse)
			data.registrations.reverse().forEach((item) => {
				const li = document.createElement("li");
				const shortHash = item.hash.substring(0, 10) + "..." + item.hash.substring(60);
				li.innerHTML = `
                    <strong>Hash:</strong> ${shortHash}<br>
                    <small>Block: ${item.block} | Tx: ${item.tx.substring(0, 10)}...</small>
                `;
				regList.appendChild(li);
			});
		}

		// Fill Verifications
		if (data.verifications.length === 0) {
			verList.innerHTML = "<li>No data found.</li>";
		} else {
			data.verifications.reverse().forEach((item) => {
				const li = document.createElement("li");
				const shortHash = item.hash.substring(0, 10) + "...";
				li.innerHTML = `
                    <strong>Verified:</strong> ${shortHash}<br>
                    <small>By: ${item.verifier.substring(0, 10)}... | Block: ${item.block}</small>
                `;
				verList.appendChild(li);
			});
		}
	} catch (error) {
		console.error(error);
		alert("Unable to load history.");
	}
}

// Helper function to show messages
function showStatus(element, message, type) {
	element.className = `status-box ${type}`;
	element.innerText = message;
	element.style.display = "block";
}

// Load history on page load
window.onload = loadHistory;
