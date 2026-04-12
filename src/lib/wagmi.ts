import { defineChain, parseGwei } from "viem";

export const ogNewton = defineChain({
  id: 16602,
  name: "0G Newton Testnet",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "0G Explorer", url: "https://scan-testnet.0g.ai" },
  },
  testnet: true,
  fees: {
    // Override fee estimation for 0G testnet.
    // MetaMask tends to drastically overestimate gas costs on this chain.
    // Real gas price is ~4 Gwei; we cap priority fee at 5 Gwei to keep
    // all transactions affordable within a small testnet wallet.
    defaultPriorityFee: parseGwei("5"),
    baseFeeMultiplier: 1.1,
  },
});
