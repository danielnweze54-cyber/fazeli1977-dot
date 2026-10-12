import { AlertDispatcher, evaluateHealth } from "./alert-rules.mjs";
import { deliver } from "./webhook.mjs";

export function createWatcher({ thresholds, webhookUrl, deliverImpl = deliver, logger }) {
  const dispatcher = new AlertDispatcher({ cooldownMs: thresholds.cooldownMs });
  let lastBlockAt = null;
  let bestBlock = null;
  let finalizedBlock = null;
  let peers = null;
  let isSyncing = null;

  function observe(snapshot) {
    const nextBest = snapshot.bestBlock;
    if (typeof nextBest === "number" && (bestBlock === null || nextBest > bestBlock)) {
      lastBlockAt = snapshot.at;
    }

    bestBlock = nextBest ?? bestBlock;
    finalizedBlock = snapshot.finalizedBlock ?? finalizedBlock;
    peers = snapshot.peers ?? peers;
    isSyncing = snapshot.isSyncing ?? isSyncing;

    const alerts = evaluateHealth(
      { bestBlock, finalizedBlock, peers, isSyncing, lastBlockAt },
      thresholds,
      snapshot.at,
    );

    return dispatcher.plan(alerts);
  }

  async function flush(alerts) {
    if (alerts.length === 0) return { delivered: false, reason: "nothing to send" };
    if (!webhookUrl) {
      logger?.("warn", "alert raised but no webhook configured", {
        alerts: alerts.map((alert) => alert.kind),
      });
      return { delivered: false, reason: "no webhook configured" };
    }
    const result = await deliverImpl(webhookUrl, alerts);
    logger?.(result.ok ? "info" : "error", result.ok ? "alert delivered" : "alert delivery failed", {
      alerts: alerts.map((alert) => alert.kind),
      ...(result.ok ? { channel: result.kind } : { error: result.error }),
    });
    return { delivered: result.ok, reason: result.error };
  }

  return { observe, flush, state: () => ({ bestBlock, finalizedBlock, peers, isSyncing, lastBlockAt }) };
}
