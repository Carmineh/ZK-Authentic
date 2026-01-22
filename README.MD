# ZK-Authentic

**ZK-Authentic** allows brands to register authentic products on-chain and customers to verify their purchases without revealing any sensitive information.

The system has two main flows:

1. **Registration (Brand)**: the brand computes a hash of the product's unique identifier and stores it on the blockchain.
2. **Verification (Customer)**: the customer generates a ZK proof that they know the secret behind the hash. The smart contract checks the proof and confirms authenticity without ever seeing the secret.

This ensures that counterfeits can be detected while preserving the privacy of both brands and customers.

---

## Why Zero-Knowledge Proofs?

Traditional authentication systems require exposing the secret (e.g., a serial number) to prove ownership. This creates attack vectors: once the secret is revealed, it can be copied.

With **Zero-Knowledge Proofs (ZKPs)**, the customer proves they know the secret _without revealing it_. The verifier (smart contract) is mathematically convinced of the claim while learning nothing about the underlying data.

Benefits:

- **Privacy**: Secrets are never transmitted or stored publicly.
- **Security**: No replay attacks, each proof is unique.
- **Trustless**: Verification happens on-chain, no third party required.

---

## Project Structure

```
Progetto/
├── backend/
│   ├── contracts/       # Solidity smart contracts
│   ├── scripts/         # Deployment scripts
│   ├── src/             # Express server + ABIs
│   ├── test/            # Contract tests
│   └── hardhat.config.cjs
├── frontend/            # Web interface
├── zokrates/            # ZK circuit and proofs
├── docs/                # Documentation (PDF)
└── README.md
```

---

## Tech Stack

| Layer        | Technology         |
| ------------ | ------------------ |
| Blockchain   | Ethereum (Hardhat) |
| Contracts    | Solidity ^0.8.0    |
| ZK Framework | ZoKrates           |
| Backend      | Node.js + Express  |
| Frontend     | Vanilla JS + CSS   |
| Library      | ethers.js v6       |

---

## License

This project was developed for the _Security and Dependability_ course.
