import { readFileSync, writeFileSync } from "node:fs";
import solc from "solc";

const source = readFileSync(new URL("../contracts/PortaPulseProof.sol", import.meta.url), "utf8");
const input = {
  language: "Solidity",
  sources: { "PortaPulseProof.sol": { content: source } },
  settings: {
    evmVersion: "paris",
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.methodIdentifiers"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((entry) => entry.severity === "error");
if (errors.length > 0) {
  throw new Error(errors.map((entry) => entry.formattedMessage).join("\n"));
}

const contract = output.contracts["PortaPulseProof.sol"].PortaPulseProof;
const bytecode = contract.evm.bytecode.object;
if (!bytecode) throw new Error("Solidity compiler produced empty contract bytecode");

const artifact = `export const PORTAPULSE_PROOF_ABI = ${JSON.stringify(contract.abi)};\n`
  + `export const PORTAPULSE_PROOF_BYTECODE = "0x${bytecode}";\n`
  + `export const PORTAPULSE_PULSE_CALLDATA = "0x${contract.evm.methodIdentifiers["pulse()"]}";\n`;

writeFileSync(new URL("../src/lib/portapulse-contract.js", import.meta.url), artifact);
console.log("Compiled PortaPulseProof.sol to src/lib/portapulse-contract.js");
