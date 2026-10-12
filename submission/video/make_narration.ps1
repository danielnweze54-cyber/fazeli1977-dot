Add-Type -AssemblyName System.Speech

$outDir = "C:\projects\portapulse\submission\video\audio"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$lines = @(
  "PortaPulse is a node operations and telemetry suite built for the Portaldot network. Every number on this dashboard is read live from Portaldot Mainnet through the Polkadot API. Nothing here is simulated.",
  "The telemetry panel shows the latest block, the finalized head and the finality lag, active peer count, and the average block time measured from observed heads.",
  "The RPC benchmark performs a real WebSocket handshake and one round trip against each configured endpoint. Here Mainnet answers in about four seconds, while the offline local node is reported as unreachable.",
  "The batch load planner sizes a transaction batch against live observed head data, and states plainly what it cannot know.",
  "The heartbeat alert panel stores a webhook endpoint locally. Delivery requires a background worker, and the interface says so rather than pretending otherwise.",
  "PortaPulse is fully open source, and built for Portaldot Hacker House 2026, Track 3."
)

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Zira Desktop")
$synth.Rate = 0
$synth.Volume = 100

for ($i = 0; $i -lt $lines.Count; $i++) {
  $n = "{0:D2}" -f $i
  $path = Join-Path $outDir "line-$n.wav"
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($lines[$i])
  $synth.SetOutputToNull()
}

$synth.Dispose()
Write-Output "generated $($lines.Count) narration clips in $outDir"
