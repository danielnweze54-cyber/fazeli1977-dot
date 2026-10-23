export const ENDPOINTS = [
  {
    id: "portaldot-testnet",
    label: "wss://test-node-v3.portaldot.dev",
    ws: "wss://test-node-v3.portaldot.dev",
    network: "Portaldot V3 Testnet",
  },
  {
    id: "portaldot-mainnet",
    label: "wss://mainnet.portaldot.io",
    ws: "wss://mainnet.portaldot.io",
    network: "Portaldot Mainnet",
  },
  {
    id: "portaldot-local",
    label: "ws://127.0.0.1:9944 (Local Node)",
    ws: "ws://127.0.0.1:9944",
    network: "Local Development Node",
  },
];

export const PORTALDOT_TESTNET = {
  evmRpc: "https://test-evm-rpc-v3.portaldot.dev",
  chainId: 420420777,
  explorer: "https://node-console.portaldot.dev/",
};

export const DEFAULT_ENDPOINT_ID = ENDPOINTS[0].id;

export function getEndpoint(id) {
  return ENDPOINTS.find((endpoint) => endpoint.id === id) ?? ENDPOINTS[0];
}

export function formatTokenAmount(planck, decimals) {
  if (planck === null || planck === undefined) return null;
  const value = Number(planck) / 10 ** decimals;
  if (!Number.isFinite(value)) return null;
  return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}
