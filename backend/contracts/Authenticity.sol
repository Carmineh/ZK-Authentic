// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Authenticity {
    
    struct Product {
        bool exists;
        string note;
        address registrant;
    }

    // Mappatura: Hash (Digital Twin ZK) -> Dati Prodotto
    mapping(uint256 => Product) public products;
    
    event ProductRegistered(uint256 indexed digitalTwinHash, string note);
    
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    // --- FUNZIONE ADMIN: REGISTRAZIONE (Paga GAS) ---
    function registerProduct(uint256 digitalTwinHash, string memory _note) public {
        require(msg.sender == admin, "Solo l'admin puo registrare");
        require(!products[digitalTwinHash].exists, "Orologio gia registrato");
        
        products[digitalTwinHash] = Product({
            exists: true,
            note: _note,
            registrant: msg.sender
        });
        
        emit ProductRegistered(digitalTwinHash, _note);
    }

    // --- FUNZIONE USER: VERIFICA (GRATIS - VIEW ONLY) ---
    function getProduct(uint256 digitalTwinHash) public view returns (bool, string memory) {
        require(products[digitalTwinHash].exists, "Orologio non trovato o Falso");
        Product memory p = products[digitalTwinHash];
        return (true, p.note);
    }
}
