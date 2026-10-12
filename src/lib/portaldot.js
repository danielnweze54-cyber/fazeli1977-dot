export { ENDPOINTS, DEFAULT_ENDPOINT_ID, getEndpoint, formatTokenAmount } from "./endpoints.js";

let polkadotApiPromise = null;

function loadPolkadotApi() {
  if (!polkadotApiPromise) {
    polkadotApiPromise = import("@polkadot/api");
  }
  return polkadotApiPromise;
}

const CONNECT_TIMEOUT_MS = 20000;

export function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function createProvider(endpoint, { autoReconnect = true } = {}) {
  const { WsProvider } = await loadPolkadotApi();
  if (autoReconnect) {
    return new WsProvider(endpoint.ws, 1000);
  }
  const provider = new WsProvider(endpoint.ws, false);
  provider.connect();
  return provider;
}

export async function connectApi(endpoint, { timeout = CONNECT_TIMEOUT_MS, provider } = {}) {
  const { ApiPromise } = await loadPolkadotApi();
  const activeProvider = provider ?? (await createProvider(endpoint));
  const connectStarted = performance.now();
  const api = await withTimeout(
    ApiPromise.create({ provider: activeProvider, noInitWarn: true }),
    timeout,
    `${endpoint.label} did not respond within ${timeout / 1000}s`,
  );
  return { api, provider: activeProvider, connectMs: Math.round(performance.now() - connectStarted) };
}

function firstNumber(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) {
    const first = Number(value[0]);
    return Number.isFinite(first) ? first : fallback;
  }
  const match = String(value).match(/-?\d+/);
  if (!match) return fallback;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readTokenDecimals(properties) {
  return firstNumber(properties?.tokenDecimals, 0);
}

function readTokenSymbol(properties) {
  const raw = properties?.tokenSymbol;
  if (Array.isArray(raw)) return String(raw[0] ?? "POT");
  const text = String(raw ?? "POT")
    .replace(/[[\]"]/g, "")
    .split(",")[0]
    .trim();
  return text || "POT";
}

export async function fetchChainInfo(api) {
  const [chain, clientName, clientVersion, health, properties, header] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
    api.rpc.system.health(),
    api.rpc.system.properties(),
    api.rpc.chain.getHeader(),
  ]);

  return {
    chain: chain.toString(),
    client: `${clientName.toString()} ${clientVersion.toString()}`,
    peers: Number(health.peers.toString()),
    isSyncing: health.isSyncing.valueOf(),
    tokenSymbol: readTokenSymbol(properties),
    tokenDecimals: readTokenDecimals(properties),
    ss58Format: firstNumber(properties?.ss58Format, 42),
    specVersion: api.runtimeVersion.specVersion.toString(),
    firstBlock: header.number.toNumber(),
  };
}

export async function fetchLatestBlockStats(api) {
  const signedBlock = await api.rpc.chain.getBlock();
  const extrinsics = signedBlock.block.extrinsics;

  const sections = new Map();
  extrinsics.forEach((extrinsic) => {
    const section = extrinsic.method.section;
    sections.set(section, (sections.get(section) ?? 0) + 1);
  });

  const timestampExtrinsic = extrinsics.find((extrinsic) => extrinsic.method.section === "timestamp");
  let timestamp = null;
  if (timestampExtrinsic) {
    const [value] = timestampExtrinsic.method.args;
    const parsed = Number(value?.toString());
    timestamp = Number.isFinite(parsed) ? parsed : null;
  }

  return {
    number: signedBlock.block.header.number.toNumber(),
    extrinsicCount: extrinsics.length,
    sections: Array.from(sections.entries()).map(([section, count]) => ({ section, count })),
    timestamp,
  };
}

export async function benchmarkEndpoint(endpoint, { timeout = 20000 } = {}) {
  const started = performance.now();
  let api = null;
  let provider = null;
  try {
    provider = await createProvider(endpoint, { autoReconnect: false });
    const connection = await connectApi(endpoint, { timeout, provider });
    api = connection.api;
    const chain = await withTimeout(api.rpc.system.chain(), timeout, "RPC timed out");
    return {
      endpointId: endpoint.id,
      label: endpoint.label,
      ok: true,
      ms: Math.round(performance.now() - started),
      chain: chain.toString(),
    };
  } catch (error) {
    return {
      endpointId: endpoint.id,
      label: endpoint.label,
      ok: false,
      ms: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (api) {
      try {
        await api.disconnect();
      } catch {
        /* ignore */
      }
    } else if (provider) {
      try {
        await provider.disconnect();
      } catch {
        /* ignore */
      }
    }
  }
}
