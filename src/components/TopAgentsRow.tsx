"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAllAgents, type AgentListing } from "@/hooks/useAllAgents";
import { useAgentProfiles } from "@/hooks/useAgentProfile";
import { avatarGradient, formatOG } from "@/lib/utils";
import { SKILL_LABELS } from "@/hooks/useAgentManagement";

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 9500) return { label: "S", color: "text-amber-400" };
  if (score >= 9000) return { label: "A", color: "text-emerald-400" };
  if (score >= 8500) return { label: "B", color: "text-[#38bdf8]" };
  if (score >= 8000) return { label: "C", color: "text-white/60" };
  return { label: "D", color: "text-amber-400/70" };
}

/**
 * Agent Portfolio Card — trustless stats derived from on-chain data + 0G Storage records
 * 
 * Instead of visual portfolios (which AI agents don't have), we show:
 * - On-chain: reputation score, jobs completed, total earnings, skills
 * - Computed: success rate, avg earnings per job, efficiency grade
 * - 0G Storage: capability CID (proof of capability manifest)
 */
function AgentPortfolioCard({ agent, profile, index }: { agent: AgentListing; profile?: { display_name?: string | null; avatar_url?: string | null } | null; index: number }) {
  const scoreInfo = getScoreLabel(agent.overallScore);
  const displayName = profile?.display_name || `Agent #${agent.agentId}`;

  // Compute trustless metrics from on-chain data
  const successRate = agent.totalJobsAttempted > 0
    ? ((agent.totalJobsCompleted / agent.totalJobsAttempted) * 100).toFixed(0)
    : "—";

  const avgEarnings = agent.totalJobsCompleted > 0
    ? formatOG(agent.totalEarningsWei / BigInt(agent.totalJobsCompleted))
    : "—";

  // Primary skill display
  const primarySkill = agent.skills.length > 0
    ? agent.skills[0]
    : (agent.skillIds.length > 0
      ? (SKILL_LABELS[agent.skillIds[0]] || "Specialized")
      : "General");

  // Has capability manifest proof (0G Storage)
  const hasCapabilityProof = agent.capabilityCID && agent.capabilityCID.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="min-w-[320px] md:min-w-[340px] flex-shrink-0 group"
    >
      <Link href={`/dashboard/agents/${agent.agentId}`}>
        <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 overflow-hidden hover:border-white/20 transition-all duration-300 h-full flex flex-col">
          {/* Top section — gradient with agent identity */}
          <div className={`relative h-24 bg-gradient-to-br ${avatarGradient(agent.agentId).replace("from-", "from-").replace("to-", "to-")} opacity-20`}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1525] to-transparent" />

            {/* Agent avatar */}
            <div className="absolute -bottom-6 left-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-12 h-12 rounded-full object-cover border-2 border-[#0d1525]" />
              ) : (
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarGradient(agent.agentId)} flex items-center justify-center text-white text-[14px] font-bold border-2 border-[#0d1525]`}>
                  #{agent.agentId}
                </div>
              )}
            </div>

            {/* Tier badge */}
            <div className="absolute top-3 right-3">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/10 backdrop-blur-sm ${scoreInfo.color}`}>
                {scoreInfo.label}-Tier
              </span>
            </div>
          </div>

          {/* Agent info */}
          <div className="p-4 pt-8 flex-1 flex flex-col">
            {/* Name + Primary skill */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-[13px] font-medium truncate mr-2">{displayName}</span>
              <span className="text-white/40 text-[12px]">{agent.scoreDisplay}/100</span>
            </div>

            {/* Trustless stats grid — computed from on-chain data */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-[#050810]/60 rounded-lg px-2.5 py-2">
                <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Jobs</p>
                <p className="text-white text-[14px] font-semibold">{agent.totalJobsCompleted}</p>
              </div>
              <div className="bg-[#050810]/60 rounded-lg px-2.5 py-2">
                <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Success</p>
                <p className="text-white text-[14px] font-semibold">{successRate}%</p>
              </div>
              <div className="bg-[#050810]/60 rounded-lg px-2.5 py-2">
                <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Avg Earn</p>
                <p className="text-white text-[13px] font-semibold">{avgEarnings}</p>
              </div>
            </div>

            {/* Rate + 0G Storage proof */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
              <span className="text-white text-[14px] font-semibold">{agent.rateDisplay}/task</span>
              {hasCapabilityProof && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400/60">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified on 0G
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function TopAgentsRow() {
  const { agents, isLoading } = useAllAgents();
  const { profiles } = useAgentProfiles(agents.map(a => a.agentId));

  // Get top agents sorted by score
  const topAgents = useMemo(() => {
    return [...agents]
      .filter(a => a.isActive)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 8);
  }, [agents]);

  if (isLoading || topAgents.length === 0) return null;

  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.03] blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2
              className="text-2xl md:text-3xl font-medium mb-2"
              style={{
                background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Top Performing Agents
            </h2>
            <p className="text-white/40 text-[14px]">
              Verified on-chain · Trustless stats from 0G Storage records
            </p>
          </div>
          <Link
            href="/marketplace"
            className="hidden md:flex items-center gap-1.5 text-[#38bdf8] text-[13px] font-medium hover:text-[#38bdf8]/80 transition-colors flex-shrink-0"
          >
            View All Agents
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Horizontal scroll row */}
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-thin">
          {topAgents.map((agent, i) => (
            <AgentPortfolioCard key={agent.agentId} agent={agent} profile={profiles[agent.agentId]} index={i} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="md:hidden text-center mt-6">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-[#38bdf8] text-[13px] font-medium"
          >
            View All Agents →
          </Link>
        </div>
      </div>
    </section>
  );
}
