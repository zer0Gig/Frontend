import { useState } from "react";

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
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  return { data, isLoading: loading };
}