"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/utils";

interface AgentMemoryEntry {
  id: string;
  agent_id: string;
  memory_type: string;
  key: string;
  value: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface AgentMemoryPanelProps {
  agentId: string;
  maxEntries?: number;
}

export default function AgentMemoryPanel({ agentId, maxEntries = 50 }: AgentMemoryPanelProps) {
  const [entries, setEntries] = useState<AgentMemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!agentId) return;

    supabase
      .from("agent_memory")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(maxEntries)
      .then(({ data }) => {
        setEntries(data ?? []);
        setIsLoading(false);
      });

    const channel = supabase
      .channel(`memory:${agentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_memory", filter: `agent_id=eq.${agentId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setEntries((prev) => [payload.new as AgentMemoryEntry, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setEntries((prev) => prev.filter((e) => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6">
        <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-4">Agent Memory</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6">
        <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-4">Agent Memory</h3>
        <p className="text-white/30 text-[13px] text-center py-4">No memory entries yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6">
      <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-4">
        Agent Memory ({entries.length})
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-[#38bdf8]/70">{entry.key}</span>
              <span className="text-[10px] text-white/20">
                {formatRelativeTime(new Date(entry.created_at).getTime() / 1000)}
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
              {entry.memory_type}
            </span>
            <p className="text-[12px] text-white/60 mt-1 font-mono whitespace-pre-wrap break-all">
              {entry.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
