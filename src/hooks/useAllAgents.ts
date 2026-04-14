"use client";

import { useState, useEffect, useCallback } from "react";

export interface AgentListing {
  agentId: number;
  capabilityCID: string;
  name: string;
  skills: string[];
  skillIds: string[];
  tags: string[];
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

interface OnChainAgent {
  agentId: number;
  owner: string;
  agentWallet: string;
  capabilityCID: string;
  profileCID: string;
  overallScore: number;
  totalJobsCompleted: number;
  totalJobsAttempted: number;
  totalEarningsWei: string;
  defaultRate: string;
  createdAt: number;
  isActive: boolean;
  displayName: string | null;
  tags: string[] | null;
}

interface ApiResponse {
  agents: OnChainAgent[];
  total: number;
}

function decodeSkillsFromCID(capabilityCID: string): string[] {
  try {
    if (!capabilityCID) return [];
    let base64 = capabilityCID;
    if (capabilityCID.includes(":")) {
      base64 = capabilityCID.split(":")[1];
    }
    const decoded = JSON.parse(atob(base64));
    return decoded.skills || [];
  } catch {
    return [];
  }
}

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().replace(/[\s_-]+/g, "");
}

export function skillMatchesFilter(skillId: string, filterId: string): boolean {
  const normalizedSkill = normalizeSkill(skillId);
  const normalizedFilter = normalizeSkill(filterId);
  return normalizedSkill.includes(normalizedFilter) || normalizedFilter.includes(normalizedSkill);
}

function mapOnChainToAgentListing(agent: OnChainAgent): AgentListing {
  const defaultRateBig = BigInt(agent.defaultRate);
  const ogRate = Number(defaultRateBig) / 1e18;

  const onChainSkillIds = decodeSkillsFromCID(agent.capabilityCID);
  const onChainSkillLabels = onChainSkillIds.map((s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
  ).filter(Boolean);

  const displayName = agent.displayName;
  const agentTags: string[] = agent.tags || [];

  const allSkillIds = [...new Set([...onChainSkillIds, ...agentTags])];
  const allSkillLabels = [...new Set([
    ...onChainSkillLabels,
    ...agentTags.map((t) => t.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())),
  ])].filter(Boolean);

  return {
    agentId: agent.agentId,
    capabilityCID: agent.capabilityCID,
    name: displayName || `Agent #${agent.agentId}`,
    skills: allSkillLabels,
    skillIds: allSkillIds,
    tags: agentTags,
    rate: agent.defaultRate,
    rateDisplay: ogRate.toFixed(3),
    scoreDisplay: (agent.overallScore / 100).toFixed(1),
    rating: agent.overallScore / 1000,
    totalJobs: agent.totalJobsCompleted,
    totalJobsCompleted: agent.totalJobsCompleted,
    totalJobsAttempted: agent.totalJobsAttempted,
    overallScore: agent.overallScore / 10000,
    isActive: agent.isActive,
    agentWallet: agent.agentWallet,
    defaultRate: defaultRateBig,
    createdAt: agent.createdAt,
    totalEarningsWei: BigInt(agent.totalEarningsWei),
  };
}

export function useAllAgents(enabled = true) {
  const [agents, setAgents] = useState<AgentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      const mapped = data.agents.map(mapOnChainToAgentListing);
      setAgents(mapped);
    } catch (err) {
      console.error("[useAllAgents] Failed to fetch agents:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchAgents();
  }, [enabled, fetchAgents]);

  return {
    agents,
    totalCount: agents.length,
    isLoading: loading,
    isError: !!error,
    refetch: fetchAgents,
    skillMatchesFilter,
  };
}