# PortaPulse ⚡

### Node Operations & Telemetry Suite for Portaldot V3

[![License: MIT](https://img.shields.io/badge/License-MIT-00E599.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-6366F1.svg)](https://fazeli1977-dot.github.io/portapulse/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Built for Portaldot Hacker House 2026](https://img.shields.io/badge/Portaldot-Hacker%20House%202026-0B0E14.svg)](#-hacker-house-2026)

PortaPulse is a high-performance telemetry, RPC benchmarking, and gas stress-testing suite designed
specifically for validator operators and node runners on the **Portaldot** network.

**Live demo:** https://fazeli1977-dot.github.io/portapulse/

## 🚀 Key Features

- **Real-Time Node Telemetry:** Live block height tracking, average block time verification, consensus health status, and active peer counts.
- **RPC Latency Benchmark:** Instant WebSocket & HTTP latency checks across testnet and local development nodes.
- **Gas & Stress Simulator:** Interactive transaction batch simulation tool to analyze throughput and estimate gas burn.
- **Heartbeat & Webhook Alerts:** Instant notification hooks for node downtime and sync failures.

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| UI | React 19, Tailwind CSS |
| Build | Vite 8 |
| Icons | Lucide React |
| Network | Substrate / EVM via `@polkadot/api` |

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                     PortaPulse Dashboard                     │
│                                                              │
│  Telemetry  │  RPC Benchmark  │  Gas Simulator  │  Alerts    │
└───────┬─────────────┬──────────────────┬─────────────┬───────┘
        │             │                  │             │
        │             │                  │             │
   ┌────▼────┐   ┌────▼─────┐      ┌─────▼────┐   ┌────▼─────┐
   │ Block   │   │ Latency  │      │ Batch    │   │ Webhook  │
   │ ticker  │   │ probe    │      │ runner   │   │ dispatch │
   └────┬────┘   └────┬─────┘      └─────┬────┘   └────┬─────┘
        │             │                  │             │
        └─────────────┴──────────┬───────┴─────────────┘
                                 │
                     ┌───────────▼────────────┐
                     │  Portaldot V3 endpoint │
                     │  WS / HTTP  (Substrate │
                     │  + EVM compatible)     │
                     └────────────────────────┘
```

## 🔌 Supported Endpoints

| Endpoint | Transport | Purpose |
| --- | --- | --- |
| `wss://mainnet.portaldot.io` | WebSocket | Portaldot Mainnet (default) |
| `ws://127.0.0.1:9944` | WebSocket | Local development node |

Every metric is read live from the selected endpoint through `@polkadot/api`. Nothing is mocked:
block height, peers, finality lag, extrinsic counts and block times all come from real RPC calls.

### Live values observed against `wss://mainnet.portaldot.io`

| Property | Value |
| --- | --- |
| Chain | Portaldot Mainnet |
| Client | Portaldot Node 2.0.0 |
| Runtime spec | 1002 |
| Token | POT, 14 decimals |
| SS58 prefix | 42 |
| Block production | roughly one block per minute |

Because Portaldot produces blocks slowly, the average block time card stays in a `Measuring…` state
until at least two heads have been observed.

## 🔬 Verification Scripts

These scripts hit the live network and are useful for confirming results independently:

| Script | Purpose |
| --- | --- |
| `node scripts/verify-client.mjs` | Connects, prints chain info and block stats, benchmarks both endpoints |
| `node scripts/measure-block-time.mjs [ms] [endpoint]` | Subscribes to new heads and reports measured block intervals |

## 🔔 Heartbeat Alert Worker

The dashboard stores a webhook URL in the browser, but a browser tab cannot alert you when your
machine is asleep. `worker/heartbeat.mjs` is a standalone Node process that polls the chain and
delivers real alerts.

```bash
cp worker.config.example.json worker.config.json   # then edit it
npm run worker
```

You can also pass the webhook through the environment instead of the config file:

```bash
PORTAPULSE_WEBHOOK="https://discord.com/api/webhooks/..." npm run worker
```

### What it watches

| Condition | Severity | Default threshold |
| --- | --- | --- |
| No new block for a while | critical | 180s |
| Node reports it is still syncing | warning | — |
| Peer count below the minimum | critical | 1 peer |
| Finality lag grows too large | warning | 10 blocks |

Alerts fire once when a condition opens, repeat on a cooldown while a critical condition persists,
and send a recovery notice when it clears. Thresholds and the poll interval live in
`worker.config.json`.

### Delivery safety

Webhook URLs are only accepted for a small allowlist of chat hosts (`discord.com`, `hooks.slack.com`)
over HTTPS. Any other host is refused before a request is made, so a stray config value cannot be
used to exfiltrate data. `worker.config.json` is gitignored because it holds a private URL.

### Tests

```bash
npm test
```

Covers the alert rules, the open/repeat/recover lifecycle, webhook host validation and payload
shape, and the poll loop's behaviour when delivery fails or no webhook is configured.

## 🏃 Getting Started Locally

```bash
git clone https://github.com/fazeli1977-dot/portapulse.git
cd portapulse
npm install
npm run dev
```

Then open the printed local URL. To produce a production build:

```bash
npm run build
npm run preview
```

### Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run `oxlint` |
| `npm run test` | Run the worker alert-rule test suite |
| `npm run verify` | Connect to the network and print chain and block stats |
| `npm run worker` | Start the standalone heartbeat alert worker |
| `npm run deploy` | Build and publish `dist/` to GitHub Pages |

## 🚀 Deployment

PortaPulse is a static Vite build, so it runs on any static host. The public demo at
https://fazeli1977-dot.github.io/portapulse/ is served from the `dist/` output.

### GitHub Pages (the live site)

`vite.config.js` sets `base: '/portapulse/'` so the build resolves assets correctly under the
repository subpath. Publish manually with the bundled `gh-pages` tooling:

```bash
npm ci
npm run deploy
```

### Continuous deployment

`.github/workflows/deploy.yml` builds and publishes the site on every push to `master`, and can
also be started by hand from the Actions tab. Enable it once under
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Other static hosts

Netlify, Vercel, Cloudflare Pages, or a plain nginx directory all work. Run `npm run build` and
serve `dist/`. When the site is hosted at a domain root instead of a subpath, set `base` in
`vite.config.js` to `/`.

## 🎬 Demo

A narrated walkthrough of the dashboard is available at
[`submission/portapulse-demo.mp4`](submission/portapulse-demo.mp4).

## 🗺️ Roadmap

- Add historical charts for block time and extrinsic counts.
- Support Prometheus export for existing validator monitoring stacks.
- Surface validator staking and slashing status once the Portaldot staking pallets are indexed.

## 🏆 Hacker House 2026

Built for **Portaldot Hacker House 2026** — *Track 3: Node Operations & Tooling*.

## 📄 License

Released under the [MIT License](LICENSE).
