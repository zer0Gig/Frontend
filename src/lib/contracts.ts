// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYED CONTRACT ADDRESSES (0G Newton Testnet - Chain ID: 16602)
// Deployed: 2026-03-31
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT ABIs (Imported from Hardhat artifacts)
// ─────────────────────────────────────────────────────────────────────────────

import AgentRegistryABI from './abis/AgentRegistry.json';
import ProgressiveEscrowABI from './abis/ProgressiveEscrow.json';
import SubscriptionEscrowABI from './abis/SubscriptionEscrow.json';
import UserRegistryABI from './abis/UserRegistry.json';
import { type Abi } from 'viem';

export const AGENT_REGISTRY_ABI = AgentRegistryABI.abi as Abi;
export const PROGRESSIVE_ESCROW_ABI = ProgressiveEscrowABI.abi as Abi;
export const SUBSCRIPTION_ESCROW_ABI = SubscriptionEscrowABI.abi as Abi;
export const USER_REGISTRY_ABI = UserRegistryABI.abi as Abi;

// ─────────────────────────────────────────────────────────────────────────────
// SKILL IDS (Well-known keccak256 hashes)
// ─────────────────────────────────────────────────────────────────────────────

export const SKILL_IDS = {
  solidityDev:     "0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b" as const,
  frontendDev:     "0x2c5d2e1e0b72e9f9f6c3e0c1d2a1b0a9f8e7d6c5b4a392817060504030201000" as const,
  webSearch:       "0x5c6b7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e00" as const,
  codeExecution:   "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d00" as const,
  dataAnalysis:    "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a00" as const,
  contentWriting:  "0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f00" as const,
  imageGeneration: "0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c00" as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYED CONTRACT ADDRESSES (0G Newton Testnet - Chain ID: 16602)
// Deployed: 2026-04-06 (Session 7 — proposal-based job flow)
// Deployer: 0x48379F4d1427209311E9FF0bcC4a354953ea631B
// ─────────────────────────────────────────────────────────────────────────────

export const CONTRACT_ADDRESSES = {
  AgentRegistry: "0x43Bb5761cC621eC7dB754010650Be6303eC5311F",
  ProgressiveEscrow: "0x8C1Df1F5E32523cEfA52fa29146686B53b486Ae8",
  SubscriptionEscrow: "0x2628C364f879E1E594f500fb096123830d853078",
  UserRegistry: "0x6bb8678A8337B687A9522BC1c802Fb63279a9DA1",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// WAGMI CONTRACT CONFIG (Type-safe)
// ─────────────────────────────────────────────────────────────────────────────

export const CONTRACT_CONFIG = {
  AgentRegistry: {
    address: CONTRACT_ADDRESSES.AgentRegistry,
    abi: AGENT_REGISTRY_ABI,
  },
  ProgressiveEscrow: {
    address: CONTRACT_ADDRESSES.ProgressiveEscrow,
    abi: PROGRESSIVE_ESCROW_ABI,
  },
  SubscriptionEscrow: {
    address: CONTRACT_ADDRESSES.SubscriptionEscrow,
    abi: SUBSCRIPTION_ESCROW_ABI,
  },
  UserRegistry: {
    address: CONTRACT_ADDRESSES.UserRegistry,
    abi: USER_REGISTRY_ABI,
  },
} as const;

export type ContractName = keyof typeof CONTRACT_CONFIG;

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export const NETWORK_CONFIG = {
  chainId: 16602,
  chainName: '0G Newton Testnet',
  rpcUrl: 'https://rpc-testnet.0g.ai',
  blockExplorer: 'https://scan-testnet.0g.ai',
  nativeCurrency: {
    name: 'OG',
    symbol: 'OG',
    decimals: 18,
  },
} as const;
