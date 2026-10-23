import {
  ENDPOINTS,
  getEndpoint,
  connectApi,
  fetchChainInfo,
  fetchLatestBlockStats,
  benchmarkEndpoint,
  formatTokenAmount,
} from "../src/lib/portaldot.js";

console.log("endpoints configured:", ENDPOINTS.map((e) => e.id).join(", "));
console.log("getEndpoint('nope') falls back to:", getEndpoint("nope").id);
console.log("formatTokenAmount(1e14, 14) =", formatTokenAmount(10 ** 14, 14));

const endpoint = getEndpoint("portaldot-testnet");
const { api } = await connectApi(endpoint);
const info = await fetchChainInfo(api);
console.log("chain info:", JSON.stringify(info, null, 1));

const block = await fetchLatestBlockStats(api);
console.log("block stats:", JSON.stringify(block, null, 1));

await api.disconnect();

const results = await benchmarkEndpoint(endpoint);
console.log("benchmark testnet:", JSON.stringify(results));

const localResult = await benchmarkEndpoint(getEndpoint("portaldot-local"), { timeout: 5000 });
console.log("benchmark local (expected failure):", JSON.stringify(localResult));

process.exit(0);
