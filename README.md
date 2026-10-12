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
| `wss://testnet-rpc.portaldot.io` | WebSocket | Portaldot public testnet |
| `https://rpc-v3.portaldot.network` | HTTP | Portaldot V3 RPC |
| `ws://127.0.0.1:9944` | WebSocket | Local development node |

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

- Replace simulated telemetry with live `@polkadot/api` subscription data.
- Persist webhook configuration and add Telegram delivery alongside Discord.
- Add historical charts for block time and throughput.
- Support Prometheus export for existing validator monitoring stacks.

## 🏆 Hacker House 2026

Built for **Portaldot Hacker House 2026** — *Track 3: Node Operations & Tooling*.

## 📄 License

Released under the [MIT License](LICENSE).
