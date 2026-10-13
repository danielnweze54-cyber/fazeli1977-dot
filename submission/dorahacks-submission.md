# PortaPulse — DoraHacks Submission Packet

Hackathon: Portaldot Hacker House 2026
Page: https://dorahacks.io/hackathon/portaldot-hacker-house-2026/detail
Submission window opens: 2026-10-13 19:30 (Asia/Tehran) = 12:00 UTC
Final deadline / code freeze: 2026-11-06 04:00 UTC

## Form Fields

| Field | Value |
| --- | --- |
| Project Name | PortaPulse |
| Tagline | High-Performance Node Operations & Real-Time Telemetry Suite for Portaldot |
| Track | Track 3: Node Operations & Tooling |
| GitHub Repository URL | https://github.com/naomi197/portapulse |
| Demo URL / Website | https://naomi197.github.io/portapulse/ |
| Project Media | `submission/portapulse-dashboard.png` |
| Pitch Deck | `submission/portapulse-pitch-deck.pptx` |
| Wallet Address | `0xf3ddb743b4f1BD8b59Bf5Bf22905555Fe5c4B7C1` |

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

PortaPulse reads directly from `wss://mainnet.portaldot.io`. Block height, finalized head, finality
lag, peer count, extrinsic counts and block times are real RPC values, not mocked figures.
Observed against Portaldot Mainnet: client `Portaldot Node 2.0.0`, runtime spec `1002`, token `POT`
with 14 decimals, SS58 prefix `42`, and roughly one block produced per minute.

## Open Items Before Final Submission

- Demo video is recorded: `submission/portapulse-demo.mp4` (63 seconds, 1080p, narrated).
- Pitch deck is prepared: `submission/portapulse-pitch-deck.pptx` (8 slides: problem, solution,
  live-data evidence, alerting, why Portaldot, status, and the ask).
- Deployment instructions are documented in the README, including a GitHub Pages workflow
  (`.github/workflows/deploy.yml`) and `npm run deploy`.
- Portaldot testnet deployment info (contract address / transaction hash / explorer link) is not
  available yet. The dashboard is a read-only monitoring client, so it holds no contract of its own.
- Repository must keep at least 3 valid commits inside the event window (Oct 14 – Nov 6).
  Current commits are dated 2026-10-12, one day before the window opens.
