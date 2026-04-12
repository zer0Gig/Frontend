"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type AgentProfile } from "@/lib/supabase";

// ── Read a single agent profile ───────────────────────────────────────────────

export function useAgentProfile(agentId: number | bigint | undefined) {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (agentId === undefined) return;
    setIsLoading(true);

    supabase
      .from("agent_profiles")
      .select("*")
      .eq("agent_id", Number(agentId))
      .single()
      .then(({ data }) => {
        setProfile(data ?? null);
        setIsLoading(false);
      });
  }, [agentId]);

  return { profile, isLoading };
}

// ── Read multiple profiles (for marketplace) ──────────────────────────────────

export function useAgentProfiles(agentIds: number[]) {
  const [profiles, setProfiles] = useState<Record<number, AgentProfile>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (agentIds.length === 0) return;
    setIsLoading(true);

    supabase
      .from("agent_profiles")
      .select("*")
      .in("agent_id", agentIds)
      .then(({ data }) => {
        const map: Record<number, AgentProfile> = {};
        (data ?? []).forEach((p) => { map[p.agent_id] = p; });
        setProfiles(map);
        setIsLoading(false);
      });
  }, [agentIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return { profiles, isLoading };
}

// ── Upsert profile (called after agent registration) ─────────────────────────

export function useUpsertAgentProfile() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const upsert = useCallback(async (
    agentId: number,
    ownerAddress: string,
    fields: {
      display_name?: string;
      avatar_url?:   string;
      bio?:          string;
      tags?:         string[];
    }
  ) => {
    setIsPending(true);
    setError(null);

    const { error: err } = await supabase
      .from("agent_profiles")
      .upsert({
        agent_id:      agentId,
        owner_address: ownerAddress.toLowerCase(),
        ...fields,
        updated_at:    new Date().toISOString(),
      }, { onConflict: "agent_id" });

    if (err) setError(err.message);
    setIsPending(false);
    return !err;
  }, []);

  return { upsert, isPending, error };
}
