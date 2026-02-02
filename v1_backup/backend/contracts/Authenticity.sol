// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Verifier.sol";

// Fix Interface per dire a Solidity che Verifier accetta 7 input
interface IVerifier {
    function verifyTx(Verifier.Proof memory proof, uint[7] memory input) external view returns (bool r);
}

contract Authenticity {
    
    // Riferimento al contratto Verifier generato da Zokrates
    IVerifier public verifier;
    
    // Mappatura degli hash (Digital Twin) validi registrati dall'Admin
    // Hash -> bool (esiste?)
    mapping(uint256 => bool) public validWatches;
    
    // Eventi che Firefly ascolterà
    event ProductRegistered(uint256 indexed digitalTwinHash, string note);
    event ProofVerified(address indexed user, uint256 indexed digitalTwinHash, bool success);

    address public admin;

    constructor(address _verifierAddress) {
        verifier = IVerifier(_verifierAddress);
        admin = msg.sender;
    }

    // --- FUNZIONE ADMIN: REGISTRAZIONE ---
    // L'Admin calcola l'hash off-chain (secretID + attributi) e lo registra qui.
    function registerProduct(uint256 digitalTwinHash, string memory note) public {
        require(msg.sender == admin, "Solo l'admin puo registrare");
        require(!validWatches[digitalTwinHash], "Orologio gia registrato");
        
        validWatches[digitalTwinHash] = true;
        
        emit ProductRegistered(digitalTwinHash, note);
    }

    // --- FUNZIONE USER: VERIFICA ---
    // L'utente invia la proof ZK.
    // Il contratto verifica che:
    // 1. La proof ZK sia matematicamente valida (tramite Verifier.sol)
    // 2. L'hash prodotto dalla proof corrisponda a un orologio registrato (validWatches)
    function verifyWatch(
        Verifier.Proof memory proof, 
        uint256[7] memory input // Input size must match Zokrates output (7 public inputs)
    ) public returns (bool) {
        
        // Zokrates Verifier aspetta input come uint256[1] memory se c'è 1 input pubblico.
        // L'errore precedente suggeriva un mismatch. Verifichiamo la signature di Verifier.sol.
        // Se Verifier.sol è stato generato correttamente per 1 input pubblico, verifyTx prenderà [1].
        // Se l'errore dice "implicit conversion to [2] requested", forse Verifier si aspetta 2 input?
        // Controlliamo Verifier.sol tra poco. Per ora abbi fede in [1] se abbiamo 1 output.
        
        bool isZkValid = verifier.verifyTx(proof, input);
        require(isZkValid, "Proof ZKP non valida!");

        // 2. Verifica che l'Hash prodotto (input[6] è l'ultimo elemento, il digest) sia nel nostro database on-chain
        uint256 producedHash = input[6];
        require(validWatches[producedHash], "Orologio non presente nel registro ufficiale!");

        emit ProofVerified(msg.sender, producedHash, true);
        
        return true;
    }
}
