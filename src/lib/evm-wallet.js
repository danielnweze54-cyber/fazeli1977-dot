import { PORTALDOT_TESTNET } from "./endpoints.js";

const RECEIPT_POLL_MS = 2000;
const RECEIPT_TIMEOUT_MS = 180000;

export const PORTALDOT_TESTNET_CHAIN_HEX = `0x${PORTALDOT_TESTNET.chainId.toString(16)}`;

export function getInjectedWallet() {
  return window.ethereum ?? null;
}

export async function ensurePortaldotTestnet(wallet) {
  const currentChain = await wallet.request({ method: "eth_chainId" });
  if (typeof currentChain !== "string") {
    throw new Error("Wallet returned an invalid chain ID.");
  }
  if (BigInt(currentChain) === BigInt(PORTALDOT_TESTNET.chainId)) return;

  try {
    await wallet.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: PORTALDOT_TESTNET_CHAIN_HEX }],
    });
  } catch (error) {
    if (!error || typeof error !== "object" || error.code !== 4902) throw error;
    await wallet.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: PORTALDOT_TESTNET_CHAIN_HEX,
        chainName: "Portaldot V3 Testnet",
        nativeCurrency: { name: "POT", symbol: "tPOT", decimals: 14 },
        rpcUrls: [PORTALDOT_TESTNET.evmRpc],
        blockExplorerUrls: [PORTALDOT_TESTNET.explorer],
      }],
    });
    await wallet.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: PORTALDOT_TESTNET_CHAIN_HEX }],
    });
  }

  const activeChain = await wallet.request({ method: "eth_chainId" });
  if (typeof activeChain !== "string" || BigInt(activeChain) !== BigInt(PORTALDOT_TESTNET.chainId)) {
    throw new Error("Wallet did not switch to Portaldot V3 Testnet. Transaction was not sent.");
  }
}

export async function waitForTransaction(wallet, hash) {
  const deadline = Date.now() + RECEIPT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const receipt = await wallet.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    });
    if (receipt && typeof receipt === "object") {
      if (receipt.status === "0x0") {
        throw new Error(`Transaction ${hash} was mined but reverted.`);
      }
      return receipt;
    }
    await new Promise((resolve) => setTimeout(resolve, RECEIPT_POLL_MS));
  }
  throw new Error(`Timed out waiting for transaction receipt: ${hash}`);
}

export async function deployProofContract(wallet, account, bytecode) {
  await ensurePortaldotTestnet(wallet);
  const hash = await wallet.request({
    method: "eth_sendTransaction",
    params: [{ from: account, data: bytecode }],
  });
  if (typeof hash !== "string" || !/^0x[0-9a-f]{64}$/i.test(hash)) {
    throw new Error("Wallet returned an invalid deployment transaction hash.");
  }
  const receipt = await waitForTransaction(wallet, hash);
  if (typeof receipt.contractAddress !== "string" || !/^0x[0-9a-f]{40}$/i.test(receipt.contractAddress)) {
    throw new Error("Deployment was mined but the receipt did not contain a valid contract address.");
  }
  return { hash, contractAddress: receipt.contractAddress };
}

export async function sendProofTransaction(wallet, account, contractAddress, calldata) {
  if (!/^0x[0-9a-f]{40}$/i.test(contractAddress)) {
    throw new Error("The saved proof contract address is invalid.");
  }
  if (!/^0x[0-9a-f]+$/i.test(calldata)) {
    throw new Error("The proof contract call data is invalid.");
  }
  await ensurePortaldotTestnet(wallet);
  const hash = await wallet.request({
    method: "eth_sendTransaction",
    params: [{ from: account, to: contractAddress, data: calldata }],
  });
  if (typeof hash !== "string" || !/^0x[0-9a-f]{64}$/i.test(hash)) {
    throw new Error("Wallet returned an invalid transaction hash.");
  }
  await waitForTransaction(wallet, hash);
  return hash;
}
