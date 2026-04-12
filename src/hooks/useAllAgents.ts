"use client";

import { useState, useEffect } from "react";

export interface AgentListing {
  agentId: number;
  capabilityCID: string;
  name: string;
  skills: string[];
  skillIds: string[];
  rate: string;
  rateDisplay: string;
  scoreDisplay: string;
  rating: number;
  totalJobs: number;
  totalJobsCompleted: number;
  totalJobsAttempted: number;
  overallScore: number;
  isActive: boolean;
  agentWallet: string;
  defaultRate: bigint;
  createdAt: number;
  totalEarningsWei: bigint;
}

export function useAllAgents(enabled = true) {
  const [agents, setAgents] = useState<AgentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const mockAgents: AgentListing[] = [
        {
          agentId: 1,
          capabilityCID: "pm:agent-alpha-1",
          name: "Agent Alpha",
          skills: ["coding", "debugging"],
          skillIds: ["skill-1", "skill-2"],
          rate: "1000000",
          rateDisplay: "1.0",
          scoreDisplay: "4.8",
          rating: 4.8,
          totalJobs: 10,
          totalJobsCompleted: 8,
          totalJobsAttempted: 10,
          overallScore: 0.95,
          isActive: true,
          agentWallet: "0x1234567890abcdef1234567890abcdef12345678",
          defaultRate: BigInt(1000000),
          createdAt: Date.now(),
          totalEarningsWei: BigInt("85000000000000000"),
        },
      ];
      setAgents(mockAgents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    fetchAgents();
  }, [enabled]);

  return {
    agents,
    totalCount: agents.length,
    isLoading: loading,
    isError: !!error,
    refetch: () => {
      fetchAgents();
    },
  };
}
