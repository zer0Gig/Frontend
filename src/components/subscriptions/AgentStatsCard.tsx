"use client";

import React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BorderBeam } from "@/components/ui/BorderBeam";
import { supabase } from "@/lib/supabase";
import type { AgentListing } from "@/hooks/useAllAgents";
import type { AgentProfile } from "@/lib/supabase";
import { Bot, Brain, Zap, Globe, Cloud, Search } from "lucide-react";

interface AgentProposalStats {
  self_improvement_rate: number;
  tasks_completed: number;
  success_rate: number;
  skills_count: number;
  tools_count: number;
  checkins_count: number;
  alerts_triggered: number;
  llm_provider?: string;
  llm_model?: string;
  runtime_type?: string;
}

interface AgentStatsCardProps {
  agentId: number;
  agent: AgentListing | null;
  profile: AgentProfile | null;
  isSelected?: boolean;
}

const PALETTES = [
  { from: "from-violet-600", to: "to-blue-500", strokeFrom: "#8b5cf6", strokeTo: "#3b82f6", areaTo: "#3b82f6", barColor: "bg-blue-400", dotColor: "bg-blue-500", textColor: "text-blue-400", glowColor: "rgba(59,130,246,0.4)" },
  { from: "from-purple-600", to: "to-pink-500", strokeFrom: "#a855f7", strokeTo: "#ec4899", areaTo: "#ec4899", barColor: "bg-purple-400", dotColor: "bg-pink-500", textColor: "text-pink-400", glowColor: "rgba(168,85,247,0.4)" },
  { from: "from-cyan-600", to: "to-teal-500", strokeFrom: "#06b6d4", strokeTo: "#14b8a6", areaTo: "#14b8a6", barColor: "bg-cyan-400", dotColor: "bg-teal-500", textColor: "text-teal-400", glowColor: "rgba(6,182,212,0.4)" },
  { from: "from-emerald-600", to: "to-green-500", strokeFrom: "#10b981", strokeTo: "#22c55e", areaTo: "#22c55e", barColor: "bg-emerald-400", dotColor: "bg-emerald-500", textColor: "text-emerald-400", glowColor: "rgba(16,185,129,0.4)" },
  { from: "from-amber-600", to: "to-orange-500", strokeFrom: "#f59e0b", strokeTo: "#f97316", areaTo: "#f97316", barColor: "bg-amber-400", dotColor: "bg-orange-500", textColor: "text-orange-400", glowColor: "rgba(245,158,11,0.4)" },
  { from: "from-rose-600", to: "to-red-500", strokeFrom: "#f43f5e", strokeTo: "#ef4444", areaTo: "#ef4444", barColor: "bg-rose-400", dotColor: "bg-red-500", textColor: "text-red-400", glowColor: "rgba(244,63,94,0.4)" },
];

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  "0g-compute": <Zap size={16} className="text-yellow-400" />,
  openai:      <Bot size={16} className="text-white/70" />,
  anthropic:   <Brain size={16} className="text-white/70" />,
  groq:        <Zap size={16} className="text-orange-400" />,
  openrouter:  <Globe size={16} className="text-white/70" />,
  alibaba:     <Cloud size={16} className="text-white/70" />,
  google:      <Search size={16} className="text-white/70" />,
};

const PROVIDER_LABELS: Record<string, string> = {
  "0g-compute": "0G Compute",
  openai: "OpenAI",
  anthropic: "Anthropic",
  groq: "Groq",
  openrouter: "OpenRouter",
  alibaba: "Alibaba",
  google: "Google",
};

const RUNTIME_COLORS: Record<string, string> = {
  platform: "bg-purple-500/15 text-purple-400 border-purple-400/30",
  "self-hosted": "bg-cyan-500/15 text-cyan-400 border-cyan-400/30",
};

const PIE_RADIUS = 15.9155;

function formatProvider(provider: string): string {
  return PROVIDER_LABELS[provider.toLowerCase()] || provider;
}

function SkeletonCard() {
  return (
    <div className="bg-[#0d1525]/60 border border-white/10 rounded-[1.5rem] overflow-hidden">
      <div className="p-7 space-y-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5" />
          <div className="space-y-2">
            <div className="h-5 w-28 bg-white/5 rounded" />
            <div className="h-3 w-20 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-white/5 rounded" />
            <div className="h-8 w-16 bg-white/5 rounded" />
          </div>
          <div className="w-24 h-24 rounded-full bg-white/5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AgentStatsCard({ agentId, agent, profile, isSelected = false }: AgentStatsCardProps) {
  const palette = PALETTES[agentId % PALETTES.length];
  const [stats, setStats] = useState<AgentProposalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agent_proposal_stats")
        .select("*")
        .eq("agent_id", agentId)
        .single();

      if (error) setStats(null);
      else setStats(data as AgentProposalStats);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchStats();
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [fetchStats]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/agent-stats/sync", { method: "POST" });
      await fetchStats();
    } catch { /* ignore */ } finally {
      setSyncing(false);
    }
  };

  const displayName = profile?.display_name || `Agent #${agentId}`;
  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : `#${agentId}`;

  const overallScore = Number(agent?.overallScore ?? 0);
  const tier = overallScore >= 9500 ? "S" : overallScore >= 9000 ? "A" : overallScore >= 8500 ? "B" : "C";
  const tierColor = overallScore >= 9500 ? "text-amber-400" : overallScore >= 9000 ? "text-emerald-400" : overallScore >= 8500 ? "text-[#38bdf8]" : "text-white/60";

  const tasksCompleted = stats?.tasks_completed ?? agent?.totalJobsCompleted ?? 0;
  const successRate = stats
    ? Math.round(stats.success_rate * 100)
    : agent && Number(agent.totalJobsAttempted) > 0
      ? Math.round((Number(agent.totalJobsCompleted) / Number(agent.totalJobsAttempted)) * 100)
      : 0;

  const skillsCount = stats?.skills_count ?? agent?.skills.length ?? 0;
  const toolsCount = stats?.tools_count ?? 0;
  const totalJobsAttempted = Number(agent?.totalJobsAttempted ?? 0);

  const provider = stats?.llm_provider?.toLowerCase() ?? null;
  const providerIcon = provider ? PROVIDER_ICONS[provider] : null;
  const providerLabel = provider ? formatProvider(provider) : null;
  const runtimeType = stats?.runtime_type?.toLowerCase() ?? null;
  const runtimeBadge = runtimeType ? RUNTIME_COLORS[runtimeType] : null;
  const hasStats = !!stats;

  const skillData = agent?.skills.length
    ? agent.skills.slice(0, 3).map((s, i) => ({
        label: s.length > 12 ? s.slice(0, 10) + ".." : s,
        pct: i === 0 ? 45 : i === 1 ? 35 : 20,
        color: i === 0 ? palette.strokeFrom : i === 1 ? palette.strokeTo : palette.areaTo,
      }))
    : [
        { label: "General", pct: 100, color: palette.strokeFrom },
      ];

  const circleRadius = 45;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = isLoaded ? circleCircumference - (successRate / 100) * circleCircumference : circleCircumference;

  const trendData = [40, 55, 48, 65, 52, 78, successRate];
  const trendPoints = trendData.map((v, i) => {
    const x = (i / (trendData.length - 1)) * 196 + 4;
    const y = 60 - (v / 100) * 55;
    return { x, y };
  });
  const linePath = trendPoints.map(p => `L${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" ");
  const areaPath = `${trendPoints.map(p => `L${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" ")} L196,60 L4,60 Z`;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (loading) return <SkeletonCard />;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const statItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" } })
  };

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover={{ y: -2 }} className={`relative bg-[#0d1525]/60 border border-white/10 rounded-[1.5rem] overflow-hidden transition-all duration-1000 ${isSelected ? "border-white/20 shadow-2xl shadow-black/40" : "hover:border-white/15"}`}>
      {isSelected && (
        <BorderBeam
          colorFrom={palette.glowColor.replace("0.4)", "1)")}
          colorTo="#a855f7"
          duration={12}
          size={200}
          borderWidth={1.5}
        />
      )}

      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className={`h-[2px] w-full bg-gradient-to-r ${palette.from} ${palette.to}`} />

      <div className="p-7">
        <div className="flex items-center space-x-4 relative z-10">
          <div className="relative group">
            <div className={`w-[72px] h-[72px] rounded-2xl bg-gradient-to-tr ${palette.from} ${palette.to} p-[1px] shadow-lg transition-transform duration-500 group-hover:scale-105`}>
              <div className="w-full h-full bg-[#050810]/90 backdrop-blur-sm rounded-[15px] flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white/80">{initials}</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0d1525] rounded-full flex items-center justify-center border border-zinc-800">
              <div className={`w-2.5 h-2.5 ${palette.dotColor} rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]`} />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {displayName}
              <span className={`text-sm font-semibold ${tierColor}`}>{tier}</span>
            </h1>
            <p className="text-sm text-white/35 font-medium tracking-wide">
              {providerLabel ?? "Autonomous Agent"} {stats?.llm_model ? `/ ${stats.llm_model}` : ""}
            </p>
            <div className="flex items-center mt-1.5 space-x-2 text-[10px] font-mono text-white/30 uppercase tracking-wider">
              <span className={`${palette.textColor} font-semibold`}>
                {agent?.isActive ? "Online" : "Offline"}
              </span>
              <span>•</span>
              <span>ID: {agentId}</span>
              {runtimeBadge && runtimeType && (
                <>
                  <span>•</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${runtimeBadge}`}>
                    {stats?.runtime_type}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent my-6" />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <h2 className="text-white/35 text-[10px] font-bold uppercase tracking-wider mb-1.5">Success Rate</h2>
            <div className="flex items-baseline gap-1">
              <motion.p className="text-4xl font-bold text-white tracking-tighter" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}>{successRate}</motion.p>
              <span className="text-lg text-white/30 font-light">%</span>
            </div>
            <p className={`text-xs ${palette.textColor} mt-2 flex items-center font-medium`}>
              <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {tasksCompleted} iterations
            </p>
          </div>

          <div className="relative w-24 h-24 flex items-center justify-center group">
            <div className={`absolute inset-0 ${palette.dotColor.replace("500", "500").replace("-", "-")}/5 rounded-full blur-xl transition-all duration-500 group-hover:${palette.dotColor.replace("500", "500")}/10`} />
            <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={circleRadius} fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-800/40" />
              <circle
                cx="50" cy="50" r={circleRadius} fill="none" stroke="url(#chart-gradient)"
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-[1500ms] ease-out"
              />
              <defs>
                <linearGradient id="chart-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={palette.strokeFrom} />
                  <stop offset="100%" stopColor={palette.strokeTo} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white/35 text-[9px] font-bold uppercase tracking-widest">Activity Trend</h2>
            <span className={`text-[9px] font-bold ${palette.textColor} ${palette.textColor.replace("text-", "bg-")}/10 px-2 py-0.5 rounded-full border ${palette.textColor.replace("text-", "border-")}/20`}>
              {totalJobsAttempted > 0 ? `+${totalJobsAttempted} jobs` : "No jobs yet"}
            </span>
          </div>
          <div className="bg-[#050810]/40 border border-white/5 rounded-2xl p-4 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${palette.dotColor}/5 rounded-full blur-2xl`} />
            <div className="absolute inset-y-4 inset-x-0 flex flex-col justify-between opacity-15 pointer-events-none">
              <div className="border-t border-zinc-600 w-full" />
              <div className="border-t border-zinc-600 w-full" />
            </div>
            <div className="relative h-10 w-full flex items-end">
              <svg viewBox="0 0 200 60" className="w-full h-full drop-shadow-md" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`area-${agentId}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={palette.strokeFrom} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={palette.strokeTo} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill={`url(#area-${agentId})`} className={`transition-all duration-1000 ease-out origin-bottom ${isLoaded ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`} />
                <path d={`M4,${trendPoints[0].y.toFixed(0)} ${linePath}`} fill="none" stroke={palette.strokeFrom} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-all duration-[1500ms] ease-out ${isLoaded ? "opacity-100" : "opacity-0"}`}
                  style={isLoaded ? { strokeDasharray: 300, strokeDashoffset: 0 } : { strokeDasharray: 300, strokeDashoffset: 300 }}
                />
              </svg>
            </div>
            <div className="flex justify-between text-[7px] text-zinc-500 font-mono mt-1.5 uppercase">
              {days.map((d, i) => (
                <span key={d} className={i === days.length - 1 ? palette.textColor + " font-bold" : ""}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10 mb-3">
          <motion.div variants={statItemVariants} initial="hidden" animate="visible" custom={0} className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5">
            <div className="flex items-center text-white/30 mb-1.5">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[9px] font-bold uppercase tracking-widest">Tasks Done</span>
            </div>
            <motion.p className="text-lg font-semibold text-white tracking-tight" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>{tasksCompleted}<span className="text-xs text-white/30 font-medium ml-0.5"></span></motion.p>
          </motion.div>
          <motion.div variants={statItemVariants} initial="hidden" animate="visible" custom={1} className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5">
            <div className="flex items-center text-white/30 mb-1.5">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
              <span className="text-[9px] font-bold uppercase tracking-widest">Skills</span>
            </div>
            <motion.p className="text-lg font-semibold text-white tracking-tight" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>{skillsCount}</motion.p>
          </motion.div>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 relative z-10">
          <h2 className="text-white/35 text-[9px] font-bold uppercase tracking-widest mb-3">Task Distribution</h2>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 relative flex-shrink-0">
              <svg viewBox="-4 -4 40 40" className="w-full h-full transform -rotate-90" overflow="visible">
                {skillData.reduce((acc, skill, i) => {
                  const offset = skillData.slice(0, i).reduce((sum, s) => sum + s.pct, 0);
                  acc.push(
                    <circle key={i} r={PIE_RADIUS} cx="16" cy="16" fill="transparent" stroke={skill.color} strokeWidth="3"
                      pathLength="100"
                      strokeDasharray={`${isLoaded ? skill.pct : 0} 100`}
                      strokeDashoffset={`-${offset}`}
                      className="transition-all duration-1000 ease-out"
                      style={{ transitionDelay: `${i * 150}ms` }}
                    />
                  );
                  return acc;
                }, [] as React.ReactNode[])}
              </svg>
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              {skillData.map((skill, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] font-medium text-white">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: skill.color }} />
                    <span className="text-white/50 truncate">{skill.label}</span>
                  </div>
                  <span className="text-white/30 font-mono ml-2 flex-shrink-0">{skill.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!hasStats && !syncing && (
          <div className="mt-4 px-3 py-3 bg-white/[0.03] rounded-lg border border-white/[0.06] text-center">
            <p className="text-[11px] text-white/30 mb-2">Stats not yet synced from chain</p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-purple-500/15 text-purple-400 border border-purple-400/30 hover:bg-purple-500/25 transition-colors disabled:opacity-50"
            >
              {syncing ? (
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Sync Stats
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
