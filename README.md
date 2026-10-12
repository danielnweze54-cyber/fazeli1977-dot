# PortaPulse ⚡

### Node Operations & Telemetry Suite for Portaldot V3

[![License: MIT](https://img.shields.io/badge/License-MIT-00E599.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-6366F1.svg)](https://naomi197.github.io/portapulse/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Built for Portaldot Hacker House 2026](https://img.shields.io/badge/Portaldot-Hacker%20House%202026-0B0E14.svg)](#-hacker-house-2026)

PortaPulse is a high-performance telemetry, RPC benchmarking, and gas stress-testing suite designed
specifically for validator operators and node runners on the **Portaldot** network.

**Live demo:** https://naomi197.github.io/portapulse/

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

## 🏃 Getting Started Locally

```bash
git clone https://github.com/naomi197/portapulse.git
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

## 🎬 Demo

A narrated walkthrough of the dashboard is available at
[`submission/portapulse-demo.mp4`](submission/portapulse-demo.mp4).

## 🗺️ Roadmap

- Add a background heartbeat worker so webhook alerts are actually delivered, not just stored.
- Add historical charts for block time and extrinsic counts.
- Support Prometheus export for existing validator monitoring stacks.
- Surface validator staking and slashing status once the Portaldot staking pallets are indexed.

## 🏆 Hacker House 2026

Built for **Portaldot Hacker House 2026** — *Track 3: Node Operations & Tooling*.

## 📄 License

Released under the [MIT License](LICENSE).
