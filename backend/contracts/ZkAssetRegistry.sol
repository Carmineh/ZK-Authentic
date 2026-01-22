// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// Define structs EXACTLY as they are in Verifier.sol
struct G1Point {
    uint X;
    uint Y;
}
struct G2Point {
    uint[2] X;
    uint[2] Y;
}
struct Proof {
    G1Point a;
    G2Point b;
    G1Point c;
}

// Updated interface to match Verifier.sol
interface IVerifier {
    function verifyTx(
        Proof memory proof,
        uint[2] memory input
    ) external view returns (bool r);
}

contract ZkAssetRegistry {
    IVerifier public verifier;
    address public owner;

    mapping(uint256 => bool) public registeredHashes;

    event ItemRegistered(uint256 indexed itemHash, string note);
    event ItemVerified(address indexed verifier, uint256 itemHash);

    constructor(address _verifierAddress) {
        verifier = IVerifier(_verifierAddress);
        owner = msg.sender;
    }

    // 1. REGISTRATION (Brand)
    function registerItem(uint256 itemHash) public {
        registeredHashes[itemHash] = true;
        emit ItemRegistered(itemHash, "Authentic product registered");
    }

    // 2. VERIFICATION (User)
    // The server still sends us a, b, c separately (easier for JSON)
    // We package them here into the 'Proof' struct for the Verifier
    function verifyAuthenticity(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) public returns (bool) {
        // A. Check that the hash is in the registry (public input)
        require(
            registeredHashes[input[0]] == true,
            "Hash not found in Registry!"
        );

        // B. Build the 'Proof' struct for the Verifier
        Proof memory proofPayload = Proof(
            G1Point(a[0], a[1]),
            G2Point(b[0], b[1]),
            G1Point(c[0], c[1])
        );

        // C. Call the Verifier with the correct signature (Struct, Input)
        // Note: verifyTx returns true/false, doesn't revert by itself, so we use require
        bool result = verifier.verifyTx(proofPayload, input);
        require(result == true, "Invalid ZK Proof: Math verification failed!");

        emit ItemVerified(msg.sender, input[0]);
        return true;
    }
}
