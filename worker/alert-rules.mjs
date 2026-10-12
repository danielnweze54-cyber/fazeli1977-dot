export const ALERT_KINDS = {
  STALL: "stall",
  SYNCING: "syncing",
  LOW_PEERS: "low-peers",
  FINALITY_LAG: "finality-lag",
};

export const DEFAULT_THRESHOLDS = {
  stallMs: 180000,
  minPeers: 1,
  finalityLagBlocks: 10,
  cooldownMs: 300000,
};

export function describeThresholds(thresholds = DEFAULT_THRESHOLDS) {
  return {
    stallSeconds: Math.round(thresholds.stallMs / 1000),
    minPeers: thresholds.minPeers,
    finalityLagBlocks: thresholds.finalityLagBlocks,
    cooldownSeconds: Math.round(thresholds.cooldownMs / 1000),
  };
}

export function evaluateHealth(snapshot, thresholds = DEFAULT_THRESHOLDS, now = Date.now()) {
  const alerts = [];
  const { bestBlock, finalizedBlock, peers, isSyncing, lastBlockAt } = snapshot ?? {};

  if (typeof lastBlockAt === "number") {
    const silentMs = now - lastBlockAt;
    if (silentMs > thresholds.stallMs) {
      alerts.push({
        kind: ALERT_KINDS.STALL,
        severity: "critical",
        message: `No new block for ${Math.round(silentMs / 1000)}s (threshold ${Math.round(thresholds.stallMs / 1000)}s). Last observed block ${bestBlock ?? "unknown"}.`,
      });
    }
  }

  if (isSyncing === true) {
    alerts.push({
      kind: ALERT_KINDS.SYNCING,
      severity: "warning",
      message: "Node reports it is still syncing, so its view of the chain may be stale.",
    });
  }

  if (typeof peers === "number" && peers < thresholds.minPeers) {
    alerts.push({
      kind: ALERT_KINDS.LOW_PEERS,
      severity: "critical",
      message: `Only ${peers} peer(s) connected (minimum ${thresholds.minPeers}). The node may be isolated.`,
    });
  }

  if (typeof bestBlock === "number" && typeof finalizedBlock === "number") {
    const lag = bestBlock - finalizedBlock;
    if (lag > thresholds.finalityLagBlocks) {
      alerts.push({
        kind: ALERT_KINDS.FINALITY_LAG,
        severity: "warning",
        message: `Finality lag is ${lag} blocks (threshold ${thresholds.finalityLagBlocks}). Finalization may be stalled.`,
      });
    }
  }

  return alerts;
}

export function diffAlerts(previousKinds, currentAlerts) {
  const currentKinds = currentAlerts.map((alert) => alert.kind);
  return {
    opened: currentAlerts.filter((alert) => !previousKinds.includes(alert.kind)),
    resolved: previousKinds.filter((kind) => !currentKinds.includes(kind)),
    currentKinds,
  };
}

export class AlertDispatcher {
  constructor({ cooldownMs = DEFAULT_THRESHOLDS.cooldownMs, now = () => Date.now() } = {}) {
    this.cooldownMs = cooldownMs;
    this.now = now;
    this.activeKinds = [];
    this.lastSentAt = new Map();
  }

  plan(alerts) {
    const { opened, resolved, currentKinds } = diffAlerts(this.activeKinds, alerts);
    this.activeKinds = currentKinds;

    const now = this.now();
    const outbox = [];

    for (const alert of opened) {
      this.lastSentAt.set(alert.kind, now);
      outbox.push(alert);
    }

    for (const kind of resolved) {
      this.lastSentAt.delete(kind);
      outbox.push({
        kind: `${kind}-recovered`,
        severity: "info",
        message: `Recovered: ${kind} condition has cleared.`,
      });
    }

    for (const alert of alerts) {
      if (opened.includes(alert)) continue;
      if (alert.severity !== "critical") continue;
      const last = this.lastSentAt.get(alert.kind) ?? 0;
      if (now - last >= this.cooldownMs) {
        this.lastSentAt.set(alert.kind, now);
        outbox.push({ ...alert, repeat: true, message: `Still active: ${alert.message}` });
      }
    }

    return outbox;
  }
}
