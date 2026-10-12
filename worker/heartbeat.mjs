#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_THRESHOLDS,
  describeThresholds,
} from "./alert-rules.mjs";
import { createWatcher } from "./watch.mjs";

const CONFIG_PATH = resolve(process.cwd(), "worker.config.json");

function loadConfig() {
  const defaults = {
    endpoint: "wss://mainnet.portaldot.io",
    webhookUrl: process.env.PORTAPULSE_WEBHOOK ?? "",
    pollMs: 20000,
    thresholds: DEFAULT_THRESHOLDS,
  };

  if (!existsSync(CONFIG_PATH)) {
    return defaults;
  }

  const file = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  return {
    ...defaults,
    ...file,
    webhookUrl: file.webhookUrl ?? defaults.webhookUrl,
    thresholds: { ...DEFAULT_THRESHOLDS, ...(file.thresholds ?? {}) },
  };
}

const config = loadConfig();
const limits = describeThresholds(config.thresholds);

let api = null;
let shuttingDown = false;

function log(level, message, extra) {
  const entry = { at: new Date().toISOString(), level, message, ...(extra ?? {}) };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else console.log(line);
}

const watcher = createWatcher({
  thresholds: config.thresholds,
  webhookUrl: config.webhookUrl,
  logger: log,
});

async function poll() {
  if (shuttingDown || !api) return;
  try {
    const [health, best, finalizedHash] = await Promise.all([
      api.rpc.system.health(),
      api.rpc.chain.getHeader(),
      api.rpc.chain.getFinalizedHead(),
    ]);
    const finalized = await api.rpc.chain.getHeader(finalizedHash);

    const alerts = watcher.observe({
      at: Date.now(),
      bestBlock: best.number.toNumber(),
      finalizedBlock: finalized.number.toNumber(),
      peers: Number(health.peers.toString()),
      isSyncing: health.isSyncing.valueOf(),
    });
    await watcher.flush(alerts);

    log("debug", "poll ok", watcher.state());
  } catch (error) {
    log("error", "poll failed", { error: error instanceof Error ? error.message : String(error) });
  }
}

async function main() {
  const { ApiPromise, WsProvider } = await import("@polkadot/api");
  log("info", "starting PortaPulse heartbeat worker", {
    endpoint: config.endpoint,
    pollMs: config.pollMs,
    thresholds: limits,
    webhookConfigured: Boolean(config.webhookUrl),
  });

  api = await ApiPromise.create({
    provider: new WsProvider(config.endpoint, 1000),
    noInitWarn: true,
  });

  const chain = await api.rpc.system.chain();
  log("info", "connected", { chain: chain.toString() });

  await poll();

  const timer = setInterval(poll, config.pollMs);

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(timer);
    log("info", "shutting down", { signal });
    try {
      await api.disconnect();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  log("error", "worker crashed", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
