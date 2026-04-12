"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { animate } from "animejs";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowDown, Check, AlertTriangle, Brain, Zap, ArrowUp, Upload, PartyPopper, X, MapPin } from "lucide-react";

interface AgentActivityEntry {
  id: string;
  job_id: number;
  agent_id: string | null;
  agent_wallet: string | null;
  phase: string;
  message: string;
  milestone_index: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const PHASE_CONFIG: Record<string, { label: string; color: string; icon: string; pulse?: boolean }> = {
  downloading_brief:  { label: "Downloading Brief",     color: "text-cyan-400",    icon: "⬇️" },
  brief_downloaded:   { label: "Brief Downloaded",      color: "text-emerald-400", icon: "✅" },
  brief_fallback:     { label: "Using Fallback Brief",  color: "text-amber-400",   icon: "⚠️" },
  processing:         { label: "Processing",            color: "text-purple-400",  icon: "🧠", pulse: true },
  processing_fallback:{ label: "Fallback Processing",   color: "text-amber-400",   icon: "⚡" },
  uploading:          { label: "Uploading Output",      color: "text-blue-400",    icon: "⬆️" },
  uploaded:           { label: "Output Uploaded",       color: "text-emerald-400", icon: "✅" },
  upload_fallback:    { label: "Upload Fallback",       color: "text-amber-400",   icon: "⚠️" },
  submitting:         { label: "Submitting",            color: "text-yellow-400",  icon: "📤" },
  completed:          { label: "Completed",             color: "text-emerald-400", icon: "🎉" },
  error:              { label: "Error",                 color: "text-red-400",     icon: "❌" },
};

interface AgentActivityByWalletProps {
  agentWallet: string;
  maxEntries?: number;
}

export default function AgentActivityByWallet({ agentWallet, maxEntries = 15 }: AgentActivityByWalletProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<AgentActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!agentWallet) return;

    supabase
      .from("agent_activity")
      .select("*")
      .eq("agent_wallet", agentWallet.toLowerCase())
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          console.error("Agent activity fetch error:", error);
        }
        setEntries(data ?? []);
        setIsLoading(false);
      });

    const channel = supabase
      .channel(`agent_activity_wallet:${agentWallet}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_activity",
          filter: `agent_wallet=eq.${agentWallet.toLowerCase()}`,
        },
        (payload) => setEntries((prev) => [...prev, payload.new as AgentActivityEntry])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [agentWallet]);

  useEffect(() => {
    if (!listRef.current) return;
    const lastChild = listRef.current.lastElementChild;
    if (!lastChild) return;

    animate(lastChild, {
      translateX: [-20, 0],
      opacity: [0, 1],
      duration: 300,
      easing: "easeOutCubic",
    });
  }, [entries.length]);

  const visibleEntries = entries.slice(-maxEntries);
  const hasEntries = visibleEntries.length > 0;
  const latestPhase = entries[entries.length - 1]?.phase;
  const isActive = latestPhase && !["completed", "error"].includes(latestPhase);

  if (!agentWallet) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6">
        <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-4">Agent Activity</h3>
        <p className="text-white/30 text-[13px] text-center py-4">No agent wallet configured.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6">
        <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-4">Agent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-2/3 animate-pulse" />
                <div className="h-2 bg-white/5 rounded w-1/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wider">Agent Activity</h3>
        {isActive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-400 text-[10px] font-semibold">LIVE</span>
          </div>
        )}
      </div>

      {hasEntries ? (
        <div ref={listRef} className="space-y-3">
          {visibleEntries.map((entry) => {
            const config = PHASE_CONFIG[entry.phase] || { label: entry.phase, color: "text-white/40", icon: "📌" };
            return (
              <div key={entry.id} className="flex items-start gap-3">
                <div className="text-lg flex-shrink-0 mt-0.5">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-[13px] font-medium ${config.color}`}>{config.label}</p>
                    {config.pulse && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse opacity-60" />
                    )}
                  </div>
                  <p className="text-white/40 text-[12px] mt-0.5 leading-relaxed">{entry.message}</p>
                  {entry.milestone_index !== null && entry.milestone_index !== undefined && (
                    <span className="text-white/25 text-[11px]">Milestone {entry.milestone_index + 1}</span>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <Link
                      href={`/dashboard/jobs/${entry.job_id}`}
                      className="text-[#38bdf8]/50 text-[11px] hover:text-[#38bdf8] transition-colors"
                    >
                      Job #{entry.job_id} →
                    </Link>
                  </div>
                  <p className="text-[11px] text-white/20 mt-1">
                    {formatRelativeTime(new Date(entry.created_at).getTime() / 1000)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-white/40 text-[13px] mb-1">No activity yet</p>
          <p className="text-white/25 text-[12px] max-w-xs mx-auto">
            When this agent is assigned to a job and begins working, activity will appear here in real-time.
          </p>
        </div>
      )}
    </div>
  );
}
