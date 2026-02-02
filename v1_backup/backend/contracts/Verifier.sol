// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() pure internal returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() pure internal returns (G2Point memory) {
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
    }
    /// @return the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) pure internal returns (G1Point memory) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
    }


    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success);
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length);
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[1];
            input[i * 6 + 3] = p2[i].X[0];
            input[i * 6 + 4] = p2[i].Y[1];
            input[i * 6 + 5] = p2[i].Y[0];
        }
        uint[1] memory out;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}

contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    struct Proof {
        Pairing.G1Point a;
        Pairing.G2Point b;
        Pairing.G1Point c;
    }
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x0fb822a65a9412f905d9c54df7cc1cdaf38ebeeed9a665f1f35b837da5a26af5), uint256(0x2a66e3e2ba680562b2c5fc714dca41e7c1e7116daa061fb76398f8616b3e46f8));
        vk.beta = Pairing.G2Point([uint256(0x2704de6358a97a66979596391a2c9e5acc53fffc84862029c10f9066a312e00f), uint256(0x016d2bfa4813dbdc3e4bb531a08628343625398a929a892e9cb443d4d42c11bc)], [uint256(0x196e5c3b26d5144e152af01f8a22f897b62d8813ccc85f883bb25f1b25243196), uint256(0x0996ce16a4d08db64c592392877ba5d5feb1c0d45ab308b1ab2d0a1ee3547fa4)]);
        vk.gamma = Pairing.G2Point([uint256(0x17af0dc8d912cb9dac58052f74cb2feb61580ab1916b08615ef0b6aed01e8751), uint256(0x155ae776e345a41db0cd3cce5416ef06ae6dc16ca7e61c710480b90b3502fbea)], [uint256(0x04e6aa8e43d2ef98dbb383123e2c1d82dc391b1106d738bf3275f3dcd2012d6b), uint256(0x21d6beecac13fbc7681a5cabb2a2d5e864c843ef2b3634fb7f392afde0451e77)]);
        vk.delta = Pairing.G2Point([uint256(0x2d7a7561245e5a189104d5f8140c4b92f5c53a5a3e7521c63f1e6ae5e584e82d), uint256(0x07d06dca51c7d089a4463315214b4e1ed78212d16db47832cc4f5f293beb6ceb)], [uint256(0x042dcd9d39f68763498e00252b9a219c624530137fe2dc2bd9c25be24f120166), uint256(0x0e1fe726b7ef6d2ed293fc2696351fcb967962002b80eb248d34920942a34855)]);
        vk.gamma_abc = new Pairing.G1Point[](8);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x11c433bb3cb7af5e9300677d65cb0e0b50c94d3cf752c7701253805dac1aed77), uint256(0x2c6ba2475b6cf09ae17fcd171ca87cc33cbe733b3e0f38d086477b8f7e7a8a77));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x038350a5ec85474580c223fc31b83ce959de1e72a9e691e66c57aaab3fbb4c52), uint256(0x0683cae3c0c11844a4cf6dc0aba392bf0d41634b4a433c9f376ea0616a471290));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x114aef005a8b01c62609d6f6537e85be5d60f8431c9693a657d1bada3a08799a), uint256(0x216c5e01d67cd52e7448ab2628746783c09edf4557f5ffb05afd56c6936fe5ea));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x183493158bc4fcc8ad4483865ff192942f6121e44a5ebb4f5c67840aab01a417), uint256(0x12edfc0ad31eff976c4b029e25c6e85e37b612de36effb61e9428b643a29c6ec));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x066a7f3ef54599a4dfeb04b8d29e8f364653411cf4bb476bb96236a32d8fd2f6), uint256(0x2725c9b6222ccd76b95b4dcf9c82c32da09fa2529071aed8b4cf1923d5881d27));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x1909e2196cb9457ee6565218c4087bea516f1f003b22f8e27bbb1d514b76351e), uint256(0x21a9a8d485fc3ff9c050332595693f9d76bda6cce46f37dd5553a6efd0785ec3));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x21cd6aaa8005bed0ced1e530fec256f7c9df899b39dfabaecc397a16fc882dd7), uint256(0x02c990366bd965dcf1f76daa846cc7f0a6a5b43f7bf2e685c08209348f3f5e48));
        vk.gamma_abc[7] = Pairing.G1Point(uint256(0x17f5e91a255bf8d7c277a9a0414cad9f46192c1fd0f1fcc75613c8b8cb38483b), uint256(0x033d9878924810bb3b150d555e5916f7921446aa1795a43bb7fa77817be69ae3));
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.gamma_abc.length);
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field);
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.gamma_abc[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.gamma_abc[0]);
        if(!Pairing.pairingProd4(
             proof.a, proof.b,
             Pairing.negate(vk_x), vk.gamma,
             Pairing.negate(proof.c), vk.delta,
             Pairing.negate(vk.alpha), vk.beta)) return 1;
        return 0;
    }
    function verifyTx(
            Proof memory proof, uint[7] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](7);
        
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
