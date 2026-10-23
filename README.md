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
| Network | Portaldot Substrate RPC via `@polkadot/api` |

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
| `wss://test-node-v3.portaldot.dev` | WebSocket | Portaldot V3 Testnet (default) |
| `wss://mainnet.portaldot.io` | WebSocket | Portaldot Mainnet |
| `ws://127.0.0.1:9944` | WebSocket | Local development node |

Every metric is read live from the selected endpoint through `@polkadot/api`. Nothing is mocked:
block height, peers, finality lag, extrinsic counts and block times all come from real RPC calls.

The separately provided EVM endpoint is `https://test-evm-rpc-v3.portaldot.dev` (chain ID
`420420777`). Dashboard telemetry and benchmarks use the WebSocket/Substrate RPC. The EVM panel
connects to an injected browser wallet and offers a small proof-contract deployment and a separate
signed `pulse()` transaction on the testnet.

### Wallet, contract deployment, and transaction proof

1. Install/unlock MetaMask (or another compatible injected EVM wallet) and connect an account.
   PortaPulse requests Portaldot V3 Testnet (chain ID `420420777`) and asks the wallet to add or
   switch networks when necessary.
2. Ensure the connected EVM account has testnet gas funds. Organizers' tPOT registration requests
   a **native SS58 address starting with `5`**; that is not the EVM address MetaMask shows. If the
   connected EVM account is unfunded, ask an organizer how EVM testnet gas is supplied rather than
   assuming the native SS58 address is interchangeable.
3. Select **Deploy proof contract** and approve the deployment in the wallet. After the deployment
   receipt is confirmed, the contract address and deployment transaction hash are saved in this
   browser's local storage.
4. Select **Send on-chain pulse** and approve that separate transaction. Its confirmed transaction
   hash is also saved and can be checked via the node explorer.

The contract records a count and emits a `Pulse` event. The app never asks for or stores a seed
phrase/private key; account access and signing stay inside the wallet. Browser-local saved proof
details are not automatically uploaded to DoraHacks: add the actual contract address, both
transaction hashes, and explorer evidence to the submission after confirming them on-chain.
Generating the app or publishing the GitHub Pages site does **not** itself deploy the contract.

The Portaldot V3 node explorer is <https://node-console.portaldot.dev/>. For test-token
distribution, the team requests a **native Portaldot SS58 address starting with `5`**, not an EVM
address starting with `0x`. If you have not already submitted one, follow the organizers'
instructions to register a native wallet and contact an administrator through the announced
support channel. Never share a seed phrase or private key.

Because Portaldot produces blocks slowly, the average block time card stays in a `Measuring…` state
until at least two heads have been observed.

## 🔬 Verification Scripts

These scripts hit the live network and are useful for confirming results independently:

| Script | Purpose |
| --- | --- |
| `node scripts/verify-client.mjs` | Connects to testnet, prints chain info and block stats, benchmarks testnet and local endpoints |
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
shape, the poll loop's behaviour, network configuration, wallet chain switching, deployment
receipts, and transaction submission.

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
| `npm run test` | Run worker, endpoint, and EVM wallet tests |
| `npm run verify` | Connect to the network and print chain and block stats |
| `npm run worker` | Start the standalone heartbeat alert worker |
| `npm run deploy` | Build and publish `dist/` to GitHub Pages |

### Hackathon final-submission requirements

The organizers confirmed that wallet connection, a real testnet deployment, and proof of at least
one real on-chain transaction are all minimum requirements. Wallet connection, contract deployment,
and a separate transaction are now implemented in the dashboard, but the on-chain requirements
remain incomplete until a user connects an eligible EVM wallet, approves both transactions, and
verifies their receipts. The static GitHub Pages deployment alone is not a testnet contract
deployment or transaction proof.

After the hackathon, the organizers say the demo must be developed into a commercial-ready project.
They will publish the specific ecosystem-support application requirements in Discord; watch the
official announcements for that process.

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
