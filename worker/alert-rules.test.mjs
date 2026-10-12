import assert from "node:assert/strict";
import test from "node:test";
import {
  ALERT_KINDS,
  AlertDispatcher,
  DEFAULT_THRESHOLDS,
  diffAlerts,
  evaluateHealth,
} from "./alert-rules.mjs";
import { buildPayload, classifyWebhook, deliver } from "./webhook.mjs";
import { createWatcher } from "./watch.mjs";

const NOW = 1_700_000_000_000;

test("healthy snapshot produces no alerts", () => {
  const alerts = evaluateHealth(
    { bestBlock: 100, finalizedBlock: 99, peers: 12, isSyncing: false, lastBlockAt: NOW - 1000 },
    DEFAULT_THRESHOLDS,
    NOW,
  );
  assert.deepEqual(alerts, []);
});

test("stalled block production raises a critical alert", () => {
  const alerts = evaluateHealth(
    { bestBlock: 100, finalizedBlock: 100, peers: 12, isSyncing: false, lastBlockAt: NOW - 400_000 },
    DEFAULT_THRESHOLDS,
    NOW,
  );
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].kind, ALERT_KINDS.STALL);
  assert.equal(alerts[0].severity, "critical");
});

test("block silence just under the threshold stays quiet", () => {
  const alerts = evaluateHealth(
    { bestBlock: 100, finalizedBlock: 100, peers: 12, isSyncing: false, lastBlockAt: NOW - 179_000 },
    DEFAULT_THRESHOLDS,
    NOW,
  );
  assert.deepEqual(alerts, []);
});

test("zero peers raises a critical isolation alert", () => {
  const alerts = evaluateHealth(
    { bestBlock: 100, finalizedBlock: 100, peers: 0, isSyncing: false, lastBlockAt: NOW },
    DEFAULT_THRESHOLDS,
    NOW,
  );
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].kind, ALERT_KINDS.LOW_PEERS);
  assert.equal(alerts[0].severity, "critical");
});

test("excessive finality lag raises a warning", () => {
  const alerts = evaluateHealth(
    { bestBlock: 200, finalizedBlock: 150, peers: 12, isSyncing: false, lastBlockAt: NOW },
    DEFAULT_THRESHOLDS,
    NOW,
  );
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].kind, ALERT_KINDS.FINALITY_LAG);
  assert.equal(alerts[0].severity, "warning");
});

test("syncing node is reported", () => {
  const alerts = evaluateHealth(
    { bestBlock: 100, finalizedBlock: 100, peers: 12, isSyncing: true, lastBlockAt: NOW },
    DEFAULT_THRESHOLDS,
    NOW,
  );
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].kind, ALERT_KINDS.SYNCING);
});

test("a null snapshot does not throw", () => {
  assert.deepEqual(evaluateHealth(null, DEFAULT_THRESHOLDS, NOW), []);
  assert.deepEqual(evaluateHealth({}, DEFAULT_THRESHOLDS, NOW), []);
});

test("diffAlerts reports opening and resolving conditions", () => {
  const first = diffAlerts([], [{ kind: "stall", severity: "critical", message: "x" }]);
  assert.deepEqual(first.opened.map((a) => a.kind), ["stall"]);
  assert.deepEqual(first.resolved, []);

  const second = diffAlerts(["stall"], []);
  assert.deepEqual(second.opened, []);
  assert.deepEqual(second.resolved, ["stall"]);
});

test("dispatcher emits an opening alert only once", () => {
  let clock = NOW;
  const dispatcher = new AlertDispatcher({ cooldownMs: 60_000, now: () => clock });
  const alert = { kind: "stall", severity: "critical", message: "stalled" };

  const first = dispatcher.plan([alert]);
  assert.equal(first.length, 1);
  assert.equal(first[0].repeat, undefined);

  const second = dispatcher.plan([alert]);
  assert.deepEqual(second, []);

  clock += 61_000;
  const third = dispatcher.plan([alert]);
  assert.equal(third.length, 1);
  assert.equal(third[0].repeat, true);
});

test("dispatcher emits a recovery notice when a condition clears", () => {
  const dispatcher = new AlertDispatcher({ now: () => NOW });
  dispatcher.plan([{ kind: "stall", severity: "critical", message: "stalled" }]);
  const recovery = dispatcher.plan([]);
  assert.equal(recovery.length, 1);
  assert.equal(recovery[0].kind, "stall-recovered");
  assert.equal(recovery[0].severity, "info");
});

test("warnings do not repeat on the cooldown timer", () => {
  let clock = NOW;
  const dispatcher = new AlertDispatcher({ cooldownMs: 1000, now: () => clock });
  const warning = { kind: "finality-lag", severity: "warning", message: "lagging" };
  assert.equal(dispatcher.plan([warning]).length, 1);
  clock += 10_000;
  assert.deepEqual(dispatcher.plan([warning]), []);
});

test("webhook classification only allows known chat hosts", () => {
  assert.equal(classifyWebhook("https://discord.com/api/webhooks/123/abc").valid, true);
  assert.equal(classifyWebhook("https://hooks.slack.com/services/T/B/X").valid, true);
  assert.equal(classifyWebhook("https://discord.com/api/webhooks/123/abc").kind, "discord");
  assert.equal(classifyWebhook("http://discord.com/api/webhooks/123/abc").valid, false);
  assert.equal(classifyWebhook("https://evil.example.com/steal").valid, false);
  assert.equal(classifyWebhook("https://discord.com/not-a-webhook").valid, false);
  assert.equal(classifyWebhook("not a url").valid, false);
});

test("discord payload carries the alert text and a severity colour", () => {
  const payload = buildPayload("discord", [
    { kind: "stall", severity: "critical", message: "no blocks" },
  ]);
  assert.equal(payload.embeds[0].color, 0xef4444);
  assert.equal(payload.embeds[0].fields[0].value, "no blocks");
});

test("slack payload uses plain text", () => {
  const payload = buildPayload("slack", [{ kind: "stall", severity: "warning", message: "slow" }]);
  assert.equal(payload.text, "*WARNING* slow");
});

test("deliver refuses unlisted hosts without calling fetch", async () => {
  let called = false;
  const result = await deliver("https://evil.example.com/x", [{ kind: "a", severity: "info", message: "m" }], {
    fetchImpl: async () => {
      called = true;
      return { ok: true };
    },
  });
  assert.equal(called, false);
  assert.equal(result.ok, false);
});

test("deliver reports non-2xx responses as failures", async () => {
  const result = await deliver(
    "https://discord.com/api/webhooks/1/abc",
    [{ kind: "a", severity: "info", message: "m" }],
    { fetchImpl: async () => ({ ok: false, status: 429 }) },
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /429/);
});

test("deliver posts to an allowed host", async () => {
  let captured = null;
  const result = await deliver(
    "https://discord.com/api/webhooks/1/abc",
    [{ kind: "stall", severity: "critical", message: "no blocks" }],
    {
      fetchImpl: async (url, options) => {
        captured = { url, options };
        return { ok: true, status: 204 };
      },
    },
  );
  assert.equal(result.ok, true);
  assert.equal(captured.url, "https://discord.com/api/webhooks/1/abc");
  assert.match(captured.options.body, /no blocks/);
});

function watcherHarness(overrides = {}) {
  const sent = [];
  const logs = [];
  const watcher = createWatcher({
    thresholds: { ...DEFAULT_THRESHOLDS, ...(overrides.thresholds ?? {}) },
    webhookUrl: overrides.webhookUrl ?? "https://discord.com/api/webhooks/1/abc",
    deliverImpl: async (url, alerts) => {
      sent.push({ url, alerts });
      return overrides.deliverResult ?? { ok: true, kind: "discord" };
    },
    logger: (level, message, extra) => logs.push({ level, message, extra }),
  });
  return { watcher, sent, logs };
}

test("watcher stays silent while the chain is healthy", async () => {
  const { watcher, sent } = watcherHarness();
  let clock = NOW;

  for (let block = 100; block <= 104; block++) {
    clock += 60_000;
    const alerts = watcher.observe({
      at: clock,
      bestBlock: block,
      finalizedBlock: block - 1,
      peers: 12,
      isSyncing: false,
    });
    await watcher.flush(alerts);
  }

  assert.equal(sent.length, 0);
  assert.equal(watcher.state().bestBlock, 104);
});

test("watcher raises a stall alert when blocks stop arriving", async () => {
  const { watcher, sent } = watcherHarness();
  let clock = NOW;

  watcher.observe({ at: clock, bestBlock: 100, finalizedBlock: 99, peers: 12, isSyncing: false });

  clock += 400_000;
  const alerts = watcher.observe({
    at: clock,
    bestBlock: 100,
    finalizedBlock: 99,
    peers: 12,
    isSyncing: false,
  });
  await watcher.flush(alerts);

  assert.equal(sent.length, 1);
  assert.equal(sent[0].alerts[0].kind, ALERT_KINDS.STALL);
});

test("watcher sends a recovery notice once blocks resume", async () => {
  const { watcher, sent } = watcherHarness();
  let clock = NOW;

  watcher.observe({ at: clock, bestBlock: 100, finalizedBlock: 99, peers: 12, isSyncing: false });
  clock += 400_000;
  await watcher.flush(
    watcher.observe({ at: clock, bestBlock: 100, finalizedBlock: 99, peers: 12, isSyncing: false }),
  );

  clock += 60_000;
  await watcher.flush(
    watcher.observe({ at: clock, bestBlock: 101, finalizedBlock: 100, peers: 12, isSyncing: false }),
  );

  assert.equal(sent.length, 2);
  assert.equal(sent[1].alerts[0].kind, "stall-recovered");
  assert.equal(sent[1].alerts[0].severity, "info");
});

test("watcher does not repeat the same stall alert every poll", async () => {
  const { watcher, sent } = watcherHarness();
  let clock = NOW;

  watcher.observe({ at: clock, bestBlock: 100, finalizedBlock: 99, peers: 12, isSyncing: false });
  clock += 400_000;

  for (let i = 0; i < 4; i++) {
    await watcher.flush(
      watcher.observe({ at: clock, bestBlock: 100, finalizedBlock: 99, peers: 12, isSyncing: false }),
    );
    clock += 20_000;
  }

  assert.equal(sent.length, 1);
});

test("watcher reports delivery failure without throwing", async () => {
  const { watcher, logs } = watcherHarness({
    deliverResult: { ok: false, error: "webhook responded 500" },
  });
  let clock = NOW;

  watcher.observe({ at: clock, bestBlock: 100, finalizedBlock: 99, peers: 12, isSyncing: false });
  clock += 400_000;
  const result = await watcher.flush(
    watcher.observe({ at: clock, bestBlock: 100, finalizedBlock: 99, peers: 12, isSyncing: false }),
  );

  assert.equal(result.delivered, false);
  assert.match(result.reason, /500/);
  assert.equal(logs.some((entry) => entry.level === "error"), true);
});

test("watcher warns instead of sending when no webhook is configured", async () => {
  const { watcher, sent, logs } = watcherHarness({ webhookUrl: "" });
  let clock = NOW;

  watcher.observe({ at: clock, bestBlock: 100, finalizedBlock: 99, peers: 12, isSyncing: false });
  clock += 400_000;
  const result = await watcher.flush(
    watcher.observe({ at: clock, bestBlock: 100, finalizedBlock: 99, peers: 12, isSyncing: false }),
  );

  assert.equal(sent.length, 0);
  assert.equal(result.delivered, false);
  assert.equal(logs.some((entry) => entry.level === "warn"), true);
});
