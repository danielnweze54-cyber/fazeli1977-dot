Add-Type -AssemblyName System.Speech

$outDir = "C:\projects\portapulse\submission\video\audio"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$lines = @(
  "PortaPulse is a node operations and telemetry suite built for the Portaldot network. This is the live dashboard.",
  "The telemetry panel tracks block height in real time, average block time, live throughput, and active validator peers.",
  "The RPC benchmark measures latency across public and local Portaldot endpoints, so operators can spot an unhealthy node instantly.",
  "The gas and stress simulator runs batch transaction loads, then reports gas burned and average finality.",
  "Webhook heartbeat alerts notify operators the moment block production slows or a node loses sync, which helps prevent validator slashing.",
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
