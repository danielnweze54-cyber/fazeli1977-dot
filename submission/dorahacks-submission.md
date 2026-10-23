# PortaPulse — DoraHacks Submission Packet

Hackathon: Portaldot Hacker House 2026
Page: https://dorahacks.io/hackathon/portaldot-hacker-house-2026/detail
Submission window opens: 2026-10-13 19:30 (Asia/Tehran) = 16:00 UTC
Final deadline / code freeze: 2026-11-06 04:00 UTC

## Form Fields

| Field | Value |
| --- | --- |
| Project Name | PortaPulse |
| Tagline | High-Performance Node Operations & Real-Time Telemetry Suite for Portaldot |
| Track | Track 3: Node Operations & Tooling |
| GitHub Repository URL | https://github.com/fazeli1977-dot/portapulse |
| Demo URL / Website | https://fazeli1977-dot.github.io/portapulse/ |
| Project Media | `submission/portapulse-dashboard.png` |
| Pitch Deck | `submission/portapulse-pitch-deck.pptx` |
| EVM Wallet Address (DoraHacks registration) | `0xf3ddb743b4f1BD8b59Bf5Bf22905555Fe5c4B7C1` |
| Native POT Wallet Address (test-token distribution) | `5HGm2p9yU6PAJXveA6Vv7yeqQkM4bq1YhpYZUGn3dxP2Jf3Z` (SS58; sent to Stella on DoraHacks) |

## Detailed Description / Pitch

### Project Overview

**PortaPulse** is a lightweight, responsive node operations and telemetry dashboard tailored for
validators, developers, and infrastructure operators on the Portaldot network.

### Key Features

- **Real-Time Telemetry:** Live monitoring of block height, peer counts, TPS, and consensus round state.
- **Dynamic RPC Benchmark:** Low-latency testing and health status checks for both public and private RPC endpoints.
- **Gas & Stress Simulator:** Interactive simulation of batch transfers, smart contract deployments, and heavy compute calls with real-time fee calculation.
- **Automated Node Health Alerts:** A standalone worker process that polls the chain and delivers real Discord or Slack alerts on stalled block production, node desync, peer isolation, or runaway finality lag.

### Tech Stack

Built with Vite, React 19, Tailwind CSS, Lucide Icons, and `@polkadot/api`. Fully open-source and
ready for production deployment.

### Live Data

PortaPulse defaults to the updated Portaldot V3 Testnet WebSocket endpoint,
`wss://test-node-v3.portaldot.dev`. Block height, finalized head, finality lag, peer count,
extrinsic counts and block times are fetched from live RPC calls, not mocked figures. The announced
EVM endpoint is `https://test-evm-rpc-v3.portaldot.dev` with chain ID `420420777`; the dashboard
uses Substrate RPC for telemetry and provides MetaMask-compatible EVM wallet connection, contract
deployment, and a separate signed proof transaction.

For tPOT distribution, the organizers require a **native Portaldot SS58 wallet address beginning
with `5`**, not an EVM address beginning with `0x`. The address above was sent to Stella on
DoraHacks, who acknowledged the message with “OK.” A live read from the Portaldot V3 Testnet
reported a free balance of `0 tPOT` at the time checked (2026-10-23); token distribution and EVM
gas funding are not yet confirmed. Never share a seed phrase or private key.

## Open Items Before Final Submission

- Demo video is recorded: `submission/portapulse-demo.mp4` (63 seconds, 1080p, narrated).
- Pitch deck is prepared: `submission/portapulse-pitch-deck.pptx` (8 slides: problem, solution,
  live-data evidence, alerting, why Portaldot, status, and the ask).
- Deployment instructions are documented in the README, including a GitHub Pages workflow
  (`.github/workflows/deploy.yml`) and `npm run deploy`.
- Wallet connection, testnet contract deployment, and a separate signed proof transaction are
  implemented in the dashboard. **Actual deployment and transaction proof remain pending wallet
  access, user approvals, and sufficient EVM testnet gas.** The submitted native SS58 address
  currently has `0 tPOT`; a static website deployment alone does not meet the on-chain requirement.
- Add the actual deployed contract address, deployment transaction hash, pulse transaction hash,
  and node-explorer verification here and in the DoraHacks submission after confirming both receipts.
- Watch the organizers' Discord announcements for the ecosystem-support application requirements
  and develop the demo into a commercial-ready project after the hackathon.
- Repository must keep at least 3 valid commits inside the event window (Oct 14 – Nov 6).
  Current commits are dated 2026-10-12, one day before the window opens.
