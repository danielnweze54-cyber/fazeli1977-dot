import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ENDPOINT_ID,
  ENDPOINTS,
  PORTALDOT_TESTNET,
  getEndpoint,
} from "./endpoints.js";

test("Portaldot V3 Testnet is the default WebSocket endpoint", () => {
  assert.equal(DEFAULT_ENDPOINT_ID, "portaldot-testnet");
  assert.equal(getEndpoint(DEFAULT_ENDPOINT_ID).ws, "wss://test-node-v3.portaldot.dev");
});

test("Portaldot V3 EVM network details match the announced testnet", () => {
  assert.deepEqual(PORTALDOT_TESTNET, {
    evmRpc: "https://test-evm-rpc-v3.portaldot.dev",
    chainId: 420420777,
    explorer: "https://node-console.portaldot.dev/",
  });
});

test("local and mainnet endpoints remain available", () => {
  assert.ok(ENDPOINTS.some((endpoint) => endpoint.id === "portaldot-mainnet"));
  assert.ok(ENDPOINTS.some((endpoint) => endpoint.id === "portaldot-local"));
});
