const DISCORD_HOSTS = ["discord.com", "discordapp.com", "canary.discord.com", "ptb.discord.com"];

export function classifyWebhook(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: "not a valid URL" };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, reason: "webhook URL must use https" };
  }

  const host = parsed.hostname.toLowerCase();

  if (DISCORD_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
    if (!parsed.pathname.startsWith("/api/webhooks/")) {
      return { valid: false, reason: "Discord webhook paths must start with /api/webhooks/" };
    }
    return { valid: true, kind: "discord" };
  }

  if (host === "hooks.slack.com") {
    return { valid: true, kind: "slack" };
  }

  return { valid: false, reason: `refusing to send to unlisted host: ${host}` };
}

export function buildPayload(kind, alerts) {
  if (kind === "slack") {
    return {
      text: alerts.map((alert) => `*${alert.severity.toUpperCase()}* ${alert.message}`).join("\n"),
    };
  }

  const color = alerts.some((alert) => alert.severity === "critical")
    ? 0xef4444
    : alerts.some((alert) => alert.severity === "warning")
      ? 0xf59e0b
      : 0x00e599;

  return {
    embeds: [
      {
        title: "PortaPulse node alert",
        color,
        fields: alerts.map((alert) => ({
          name: alert.kind,
          value: alert.message,
          inline: false,
        })),
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function deliver(url, alerts, { fetchImpl = fetch, timeoutMs = 10000 } = {}) {
  const check = classifyWebhook(url);
  if (!check.valid) {
    return { ok: false, error: check.reason };
  }

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildPayload(check.kind, alerts)),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return { ok: false, error: `webhook responded ${response.status}`, kind: check.kind };
    }
    return { ok: true, kind: check.kind };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
