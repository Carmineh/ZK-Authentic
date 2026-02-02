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
        vk.alpha = Pairing.G1Point(uint256(0x1f09ddce2a16babfacb13807624a2b078663454d4ba610bbcdc14aa6b45a4f53), uint256(0x1502bdcb45038f62b95a7688316b0b56bb9b4723ea4822153122eebec5cc221a));
        vk.beta = Pairing.G2Point([uint256(0x103b6fcabd2e0f42bfcde966d803d0babef7a689547a1a94250f8c33fc794f8f), uint256(0x01c4a8b522f296a01ebc556307426386fb821223c184ad6c19694a007bd360ed)], [uint256(0x2a61f18c2e1e5029a7cd15268dcbacd57c807f220daec4b9135f06bbf79be40d), uint256(0x1918b084a84110a09026742d49a961e2837fc67019e979d02f57f82d0913cd94)]);
        vk.gamma = Pairing.G2Point([uint256(0x12e8bb94bf3eb8b557b847471e3d1d1d7aa4fbf5d9a31869a2dd35d35ecd8c46), uint256(0x14f8ef621cb729904771cd15bde1877858b2001edc46cf0c0343f32cafc68065)], [uint256(0x15b36b954a76af38e6b036526cd45461c3102fd7e69cf09a6dd6c4ca41313fc3), uint256(0x1d1d888437e039a3be2d204ceb1892686653731e1bf373a939edffe7b3443ea1)]);
        vk.delta = Pairing.G2Point([uint256(0x0af7ee46321ebabdbfb20a50b522a33d199775044dd78417ab532f3480d3279b), uint256(0x0cae38c7172853699eb2b1a8e38145c11e39225db7be4a5861f280e639a75342)], [uint256(0x0dadf18c9097112505dcb9b2474ba86d35fde958b08bc129aa2a109ef66fee76), uint256(0x0d490de72e506f74c72626f1b150271d1c894f82685c5da5526aa6841de3341f)]);
        vk.gamma_abc = new Pairing.G1Point[](8);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x134d061d1d7bedcabd7bf9dc5008b5458bf01a70c5454e164584467a92cf19ac), uint256(0x0d1d16a254b911ef51e98bfc0ed92a91cbf39bc39350ba8d41256b9526ae733b));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x19dd096bea7cf94e9bacebb1120f676b5f7108a516e87719037315f25952e07f), uint256(0x0ee1b6983c17dd8967b4d910b0465b7182863e7598922c67ed66873f1eab4939));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x2d00c88ca560751ac0e1e11bb1fd7ec00b74123d9f6a8cb63efc0043b0c7cf54), uint256(0x18f4c68431b41e1d663630d8d67fe8423d0fabdb90bf416093efce63a2b31294));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x1b1672d038c042c358c1018c80e54a3e03360af6c5f6ae7ae4cd60116a27666b), uint256(0x167a46ac06422ec8c92aa1318795db1f034432a956c5df111d82d7cfd4bc596e));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x170dd4371236cf3d9a4941b9c9d588101d9dfcc2b061403830f88b95c774e447), uint256(0x2e67491f6f4b96ef74f6d1d8d6378946709155e5d91227aafa10b26376c49ded));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x091c0d52df229d93e7f43b8bd8697451e05d6b7a9fff2aaebd39344435dc2fe9), uint256(0x09d97c3480bfe1f92ab1ad57357c56c0a9a5e609c54082c09d2355f71f68d111));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x034f15312f8c09ea63e8fbaa03d48b6470bb35ce21652d61d930314eb932bbb3), uint256(0x04533aeb6c66340c10aea1d30d48d4f49edac316e00c1df6bb66ca900e596dc0));
        vk.gamma_abc[7] = Pairing.G1Point(uint256(0x0bd5f63320b4e49d9f070281521459324840c0d1ba64b883c1066cc8be8e7763), uint256(0x0e32cfdd12a8e205950e3c2c8bba79105698e6444e5ae1fe4db59cfb252a08a6));
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
