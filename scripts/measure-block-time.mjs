import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const WebSocketImpl = require("ws");

const OBSERVE_MS = Number(process.argv[2] ?? 180000);
const ENDPOINT = process.argv[3] ?? "wss://test-node-v3.portaldot.dev";

const ws = new WebSocketImpl(ENDPOINT);
const heads = [];
let id = 0;
const pending = new Map();

function call(method, params = [], timeoutMs = 20000) {
  return new Promise((resolve) => {
    const reqId = ++id;
    const timer = setTimeout(() => {
      pending.delete(reqId);
      resolve({ error: `timeout ${timeoutMs}ms` });
    }, timeoutMs);
    pending.set(reqId, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
    ws.send(JSON.stringify({ jsonrpc: "2.0", id: reqId, method, params }));
  });
}

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.method === "chain_newHead") {
    heads.push({ number: Number.parseInt(msg.params.result.number, 16), at: Date.now() });
    return;
  }
  const handler = pending.get(msg.id);
  if (handler) {
    pending.delete(msg.id);
    handler(msg);
  }
});

ws.on("open", async () => {
  const sub = await call("chain_subscribeNewHeads");
  const startedAt = Date.now();
  console.log(`observing ${OBSERVE_MS / 1000}s on ${ENDPOINT} ...`);

  setTimeout(async () => {
    const elapsed = (Date.now() - startedAt) / 1000;
    console.log(`\nheads received: ${heads.length} over ${elapsed.toFixed(1)}s`);
    heads.forEach((h) => console.log(`  #${h.number}  t+${((h.at - startedAt) / 1000).toFixed(1)}s`));

    const numbers = heads.map((h) => h.number);
    if (numbers.length >= 2) {
      const span = numbers[numbers.length - 1] - numbers[0];
      console.log(`\nblocks advanced: ${span} (${numbers[0]} -> ${numbers[numbers.length - 1]})`);
      console.log(`average block time: ${(elapsed / Math.max(span, 1)).toFixed(2)}s`);
      for (let i = 1; i < heads.length; i++) {
        console.log(
          `  interval ${((heads[i].at - heads[i - 1].at) / 1000).toFixed(1)}s for ${numbers[i] - numbers[i - 1]} block(s)`,
        );
      }
    } else {
      console.log("\nnot enough heads observed to compute block time");
    }

    const block = await call("chain_getBlock");
    if (block.result) {
      console.log(`\nlatest block extrinsics: ${block.result.block.extrinsics.length}`);
    }

    if (sub.result) await call("chain_unsubscribeNewHeads", [sub.result], 8000);
    ws.close();
    process.exit(0);
  }, OBSERVE_MS);
});

ws.on("error", (err) => {
  console.log("WS error:", err.message);
  process.exit(1);
});
