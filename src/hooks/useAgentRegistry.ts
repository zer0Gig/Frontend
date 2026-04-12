import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_CONFIG } from '../lib/contracts';
import { Address } from 'viem';

/**
 * Hook to read an agent's profile from AgentRegistry
 */
export function useAgentProfile(agentId: bigint | number) {
  return useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address as Address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: 'getAgentProfile',
    args: [BigInt(agentId)],
  });
}

/**
 * Hook to check if an agent has a specific skill
 */
export function useHasSkill(agentId: bigint | number | undefined, skillId: string | undefined) {
  const ZERO_SKILL = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const enabled = !!agentId && !!skillId && skillId !== ZERO_SKILL;
  return useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address as Address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: 'hasSkill',
    args: enabled ? [BigInt(agentId!), skillId as `0x${string}`] : undefined,
    query: { enabled },
  });
}

/**
 * Hook to get all agents owned by an address
 */
export function useOwnerAgents(ownerAddress: Address | undefined) {
  return useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address as Address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: 'getOwnerAgents',
    args: ownerAddress ? [ownerAddress] : undefined,
    query: {
      enabled: !!ownerAddress,
    },
  });
}

/**
 * Hook to mint a new agent (updated to AgentRegistry v2 signature)
 */
export function useMintAgent() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const mintAgent = async (
    defaultRate: bigint,
    profileCID: string,
    capabilityCID: string,
    skillIds: `0x${string}`[],
    agentWallet: Address,
    eciesPublicKey: `0x${string}`
  ) => {
    writeContract({
      address: CONTRACT_CONFIG.AgentRegistry.address as Address,
      abi: CONTRACT_CONFIG.AgentRegistry.abi,
      functionName: 'mintAgent',
      args: [defaultRate, profileCID, capabilityCID, skillIds, agentWallet, eciesPublicKey],
      // capabilityCID is a base64-encoded manifest string (can be 800-1500 chars).
      // Each 32-byte storage slot costs ~22k gas cold → 1500 chars ≈ 47 slots ≈ 1M gas.
      // Skills add ~88k gas each. 2M covers up to ~10 skills with a large manifest.
      gas: BigInt(2_000_000),
    });
  };

  return {
    mintAgent,
    isPending,
    isSuccess,
    isError,
    data,
    error,
  };
}
