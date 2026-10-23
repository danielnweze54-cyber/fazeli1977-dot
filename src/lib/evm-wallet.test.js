import assert from "node:assert/strict";
import test from "node:test";
import {
  deployProofContract,
  ensurePortaldotTestnet,
  PORTALDOT_TESTNET_CHAIN_HEX,
  sendProofTransaction,
} from "./evm-wallet.js";

const TX_HASH = `0x${"1".repeat(64)}`;
const CONTRACT_ADDRESS = `0x${"2".repeat(40)}`;

test("testnet is switched only when the connected wallet is on another chain", async () => {
  const requests = [];
  const wallet = {
    async request(request) {
      requests.push(request);
      return "0x190f1ca9";
    },
  };

  await ensurePortaldotTestnet(wallet);
  assert.deepEqual(requests, [{ method: "eth_chainId" }]);
  assert.equal(PORTALDOT_TESTNET_CHAIN_HEX, "0x190f1ca9");
});

test("switches an existing wallet network to Portaldot V3 Testnet", async () => {
  const requests = [];
  let chainId = "0x1";
  const wallet = {
    async request(request) {
      requests.push(request);
      if (request.method === "eth_chainId") return chainId;
      if (request.method === "wallet_switchEthereumChain") chainId = PORTALDOT_TESTNET_CHAIN_HEX;
      return null;
    },
  };

  await ensurePortaldotTestnet(wallet);
  assert.deepEqual(requests.map(({ method }) => method), [
    "eth_chainId",
    "wallet_switchEthereumChain",
    "eth_chainId",
  ]);
  assert.equal(requests[1].params[0].chainId, PORTALDOT_TESTNET_CHAIN_HEX);
});

test("adds the testnet to a wallet that does not know the chain", async () => {
  const requests = [];
  let chainId = "0x1";
  const wallet = {
    async request(request) {
      requests.push(request);
      if (request.method === "eth_chainId") return chainId;
      if (request.method === "wallet_switchEthereumChain") {
        if (chainId === PORTALDOT_TESTNET_CHAIN_HEX) return null;
        throw Object.assign(new Error("Unknown chain"), { code: 4902 });
      }
      if (request.method === "wallet_addEthereumChain") chainId = PORTALDOT_TESTNET_CHAIN_HEX;
      return null;
    },
  };

  await ensurePortaldotTestnet(wallet);
  assert.deepEqual(requests.map(({ method }) => method), [
    "eth_chainId",
    "wallet_switchEthereumChain",
    "wallet_addEthereumChain",
    "wallet_switchEthereumChain",
    "eth_chainId",
  ]);
  assert.equal(requests[2].params[0].chainId, PORTALDOT_TESTNET_CHAIN_HEX);
});

test("does not proceed if the wallet fails to switch to testnet", async () => {
  const wallet = {
    async request({ method }) {
      if (method === "eth_chainId") return "0x1";
      return null;
    },
  };
  await assert.rejects(ensurePortaldotTestnet(wallet), /did not switch to Portaldot V3 Testnet/);
});

test("deploys and verifies a contract address from the confirmed receipt", async () => {
  const requests = [];
  const wallet = {
    async request(request) {
      requests.push(request);
      if (request.method === "eth_chainId") return PORTALDOT_TESTNET_CHAIN_HEX;
      if (request.method === "eth_sendTransaction") return TX_HASH;
      if (request.method === "eth_getTransactionReceipt") {
        return { status: "0x1", contractAddress: CONTRACT_ADDRESS };
      }
      throw new Error(`Unexpected request: ${request.method}`);
    },
  };

  const deployment = await deployProofContract(wallet, CONTRACT_ADDRESS, "0x6000");
  assert.deepEqual(deployment, { hash: TX_HASH, contractAddress: CONTRACT_ADDRESS });
  assert.equal(requests[1].params[0].data, "0x6000");
});

test("sends a proof call and rejects invalid stored contract addresses", async () => {
  const requests = [];
  const wallet = {
    async request(request) {
      requests.push(request);
      if (request.method === "eth_chainId") return PORTALDOT_TESTNET_CHAIN_HEX;
      if (request.method === "eth_sendTransaction") return TX_HASH;
      if (request.method === "eth_getTransactionReceipt") return { status: "0x1" };
      throw new Error(`Unexpected request: ${request.method}`);
    },
  };

  assert.equal(
    await sendProofTransaction(wallet, CONTRACT_ADDRESS, CONTRACT_ADDRESS, "0x12345678"),
    TX_HASH,
  );
  await assert.rejects(
    sendProofTransaction(wallet, CONTRACT_ADDRESS, "invalid", "0x12345678"),
    /contract address is invalid/,
  );
  assert.equal(requests[1].params[0].to, CONTRACT_ADDRESS);
  assert.equal(requests[1].params[0].data, "0x12345678");
});
