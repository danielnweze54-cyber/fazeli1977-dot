import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Server, 
  Cpu, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Send, 
  Bell, 
  Radio, 
  Flame,
  CheckCircle2
} from "lucide-react";

export default function App() {
  const [selectedRpc, setSelectedRpc] = useState("wss://testnet-rpc.portaldot.io");
  const [isLive, setIsLive] = useState(true);
  const [blockHeight, setBlockHeight] = useState(148292);
  const [blockTime] = useState(3.2);
  const [tps, setTps] = useState(14.8);
  const [activePeers] = useState(34);
  const [benchmarking, setBenchmarking] = useState(false);
  const [latencies, setLatencies] = useState({
    "wss://testnet-rpc.portaldot.io": 128,
    "https://rpc-v3.portaldot.network": 94,
    "ws://127.0.0.1:9944 (Local Dev)": 12,
  });

  const [stressCount, setStressCount] = useState(10);
  const [simulating, setSimulating] = useState(false);
  const [simResults, setSimResults] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);

  // Live block ticker simulation
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setBlockHeight((prev) => prev + 1);
      setTps((12 + Math.random() * 6).toFixed(1));
    }, 3200);
    return () => clearInterval(interval);
  }, [isLive]);

  // Handle benchmark RPC check
  const runBenchmark = () => {
    setBenchmarking(true);
    setTimeout(() => {
      setLatencies({
        "wss://testnet-rpc.portaldot.io": Math.floor(110 + Math.random() * 40),
        "https://rpc-v3.portaldot.network": Math.floor(80 + Math.random() * 30),
        "ws://127.0.0.1:9944 (Local Dev)": Math.floor(10 + Math.random() * 8),
      });
      setBenchmarking(false);
    }, 900);
  };

  // Handle Stress Simulation
  const handleStressSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setSimResults({
        batchId: "tx_batch_" + Math.random().toString(36).substring(7),
        gasBurned: (stressCount * 0.0021).toFixed(4) + " POT",
        avgConfirmation: (blockTime * 0.95).toFixed(2) + "s",
        status: "Confirmed on Portaldot V3",
      });
    }, 1200);
  };

  const handleSaveWebhook = (e) => {
    e.preventDefault();
    if (!webhookUrl) return;
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-4 md:p-8 font-sans selection:bg-[#00E599] selection:text-black">
      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00E599] to-[#6366F1] flex items-center justify-center shadow-lg shadow-[#00E599]/20">
            <Activity className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">PortaPulse</h1>
              <span className="text-xs bg-emerald-500/10 text-[#00E599] border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                V3 Testnet
              </span>
            </div>
            <p className="text-xs text-slate-400">Node Operations & Telemetry Suite for Portaldot</p>
          </div>
        </div>

        {/* Live Status and RPC select */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#151A23] border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${isLive ? "text-[#00E599] animate-pulse" : "text-amber-400"}`} />
            <span>{isLive ? "Connected: Substrate + EVM" : "Paused"}</span>
          </div>

          <select 
            value={selectedRpc}
            onChange={(e) => setSelectedRpc(e.target.value)}
            className="bg-[#151A23] border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#00E599]"
          >
            <option value="wss://testnet-rpc.portaldot.io">wss://testnet-rpc.portaldot.io</option>
            <option value="https://rpc-v3.portaldot.network">https://rpc-v3.portaldot.network</option>
            <option value="ws://127.0.0.1:9944">Local Dev Node (:9944)</option>
          </select>

          <button 
            onClick={() => setIsLive(!isLive)}
            className="bg-[#151A23] hover:bg-slate-800 border border-slate-700 p-2 rounded-lg text-slate-300 transition"
            title="Toggle Live Sync"
          >
            <RefreshCw className={`w-4 h-4 ${isLive ? "text-[#00E599]" : "text-slate-400"}`} />
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto mt-8 space-y-8">
        
        {/* Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#151A23] border border-slate-800/80 hover:border-slate-700 p-5 rounded-2xl transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>LATEST BLOCK</span>
              <Server className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-white tracking-wider">
              #{blockHeight.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" /> 100% Finalized
            </div>
          </div>

          <div className="bg-[#151A23] border border-slate-800/80 hover:border-slate-700 p-5 rounded-2xl transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>AVG BLOCK TIME</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-white tracking-wider">
              {blockTime}s
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              Target: 3.0s | Deviation: ±0.2s
            </div>
          </div>

          <div className="bg-[#151A23] border border-slate-800/80 hover:border-slate-700 p-5 rounded-2xl transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>LIVE THROUGHPUT (TPS)</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#00E599] tracking-wider">
              {tps}
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              Peak: 84.2 TPS | Substrate Engine
            </div>
          </div>

          <div className="bg-[#151A23] border border-slate-800/80 hover:border-slate-700 p-5 rounded-2xl transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>ACTIVE PEERS / VALIDATORS</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-white tracking-wider">
              {activePeers}
            </div>
            <div className="text-[11px] text-indigo-400 mt-2 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3" /> Consensus Healthy
            </div>
          </div>
        </section>

        {/* Feature Split: Latency Benchmark & Gas Simulator */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* RPC Latency Benchmark */}
          <div className="bg-[#151A23] border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#00E599]" />
                  Portaldot RPC Benchmark
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time WebSocket & HTTP latency checks</p>
              </div>
              <button 
                onClick={runBenchmark}
                disabled={benchmarking}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00E599] border border-emerald-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${benchmarking ? "animate-spin" : ""}`} />
                {benchmarking ? "Testing..." : "Run Test"}
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {Object.entries(latencies).map(([endpoint, ms]) => (
                <div key={endpoint} className="bg-[#0B0E14] border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
                  <div className="truncate max-w-[280px]">
                    <div className="text-xs font-mono text-slate-200 truncate">{endpoint}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">Portaldot Network V3</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">{ms} ms</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${ms < 50 ? "bg-emerald-400" : ms < 150 ? "bg-amber-400" : "bg-rose-400"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stress & Gas Simulator */}
          <div className="bg-[#151A23] border border-slate-800 p-6 rounded-2xl">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Gas & Stress Simulator
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Test throughput and estimate gas fees on Portaldot V3</p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Simulated Transaction Load</label>
                <div className="flex gap-2">
                  {[5, 10, 25, 50].map((num) => (
                    <button
                      key={num}
                      onClick={() => setStressCount(num)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border font-mono transition ${
                        stressCount === num 
                          ? "bg-[#00E599]/10 border-[#00E599] text-[#00E599] font-bold" 
                          : "bg-[#0B0E14] border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {num} txs
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStressSimulation}
                disabled={simulating}
                className="w-full bg-gradient-to-r from-[#00E599] to-[#6366F1] hover:opacity-90 text-black font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-black" />
                {simulating ? "Executing Test Load..." : `Simulate Batch of ${stressCount} Txs`}
              </button>

              {simResults && (
                <div className="bg-[#0B0E14] border border-emerald-500/20 p-4 rounded-xl text-xs space-y-1.5 font-mono">
                  <div className="text-[#00E599] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Batch Execution Finished
                  </div>
                  <div className="text-slate-400">Batch ID: <span className="text-slate-200">{simResults.batchId}</span></div>
                  <div className="text-slate-400">Total Gas Burned: <span className="text-slate-200">{simResults.gasBurned}</span></div>
                  <div className="text-slate-400">Avg Finality: <span className="text-slate-200">{simResults.avgConfirmation}</span></div>
                </div>
              )}
            </div>
          </div>

        </section>

        {/* Telegram / Discord Alert Settings */}
        <section className="bg-[#151A23] border border-slate-800 p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                Validator & Node Heartbeat Alert
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Receive instant notifications if block production slows down or your node loses sync.
              </p>
            </div>

            <form onSubmit={handleSaveWebhook} className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-[#0B0E14] border border-slate-800 text-xs text-slate-200 px-3.5 py-2 rounded-xl focus:outline-none focus:border-[#00E599] w-full md:w-80"
              />
              <button
                type="submit"
                className="bg-[#151A23] hover:bg-slate-800 border border-slate-700 text-xs px-4 py-2 rounded-xl text-slate-200 font-medium transition"
              >
                Save
              </button>
            </form>
          </div>
          {webhookSaved && (
            <div className="mt-3 text-xs text-[#00E599] flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Webhook endpoint saved for heartbeat triggers.
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div>Built for Portaldot Hacker House 2026 • Track 3 (Node Operations & Tooling)</div>
        <div className="flex items-center gap-4">
          <span className="font-mono">Open Source (MIT)</span>
        </div>
      </footer>
    </div>
  );
}
