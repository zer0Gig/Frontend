import { useState } from "react";
import { useReadContract } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import { Address } from "viem";

export interface Skill {
  id: string;
  label: string;
  category: string;
}

export const ALL_SKILLS: Skill[] = [
  { id: "solidity-dev", label: "Solidity Dev", category: "coding" },
  { id: "content-writing", label: "Content Writing", category: "writing" },
  { id: "data-analysis", label: "Data Analysis", category: "data" },
  { id: "image-generation", label: "Image Generation", category: "creative" },
  { id: "web-search", label: "Web Search", category: "research" },
  { id: "code-execution", label: "Code Execution", category: "coding" },
];

export const SKILL_LABELS: Record<string, string> = {
  "solidity-dev": "Solidity Dev",
  "content-writing": "Content Writing",
  "data-analysis": "Data Analysis",
  "image-generation": "Image Generation",
  "web-search": "Web Search",
  "code-execution": "Code Execution",
};

export const SKILL_CATEGORIES: Record<string, string> = {
  "solidity-dev": "coding",
  "content-writing": "writing",
  "data-analysis": "data",
  "image-generation": "creative",
  "web-search": "research",
  "code-execution": "coding",
};

export const SKILL_IDS_TO_BYTES32: Record<string, `0x${string}`> = {
  "solidity-dev": "0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b",
  "frontend-dev": "0x2c5d2e1e0b72e9f9f6c3e0c1d2a1b0a9f8e7d6c5b4a392817060504030201000",
  "web-search": "0x5c6b7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e00",
  "code-execution": "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d00",
  "data-analysis": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a00",
  "content-writing": "0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f00",
  "image-generation": "0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c00",
};

export function skillIdsToBytes32(skillIds: string[]): `0x${string}`[] {
  return skillIds.map(id => SKILL_IDS_TO_BYTES32[id] || id as `0x${string}`).filter(Boolean);
}

export const BYTES32_TO_SKILL_ID: Record<string, string> = Object.fromEntries(
  Object.entries(SKILL_IDS_TO_BYTES32).map(([k, v]) => [v, k])
);

export function bytes32ToSkillLabels(bytes32Skills: string[]): string[] {
  return bytes32Skills.map(b => {
    const skillId = BYTES32_TO_SKILL_ID[b];
    return skillId ? SKILL_LABELS[skillId] || skillId : b.slice(0, 10) + "...";
  });
}

export function useAgentManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAgent = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Updating agent:", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return { updateAgent, loading, error };
}

export function useRegisterAgent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Registering agent:", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}

export function useTotalAgents() {
  const [totalAgents, setTotalAgents] = useState<number>(0);
  return { data: totalAgents };
}

export function useAgentSkills(agentId: bigint | string | undefined) {
  const enabled = agentId !== undefined;
  const { data: bytes32Skills, isLoading, isError, error } = useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address as Address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: 'getAgentSkills',
    args: enabled ? [BigInt(agentId)] : undefined,
    query: { enabled },
  });

  const data = bytes32Skills ? bytes32ToSkillLabels(bytes32Skills as string[]) : [];

  return { data, isLoading, isError, error };
}