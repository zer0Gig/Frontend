"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAgentProfile } from "@/hooks/useAgentRegistry";
import { useAgentProfile as useSupabaseAgentProfile } from "@/hooks/useAgentProfile";
import { useAgentSkills } from "@/hooks/useAgentManagement";
import { useJobDetails } from "@/hooks/useProgressiveEscrow";
import { formatOG, avatarGradient, formatRelativeTime } from "@/lib/utils";
import { SKILL_LABELS } from "@/hooks/useAgentManagement";
import RBACGuard from "@/components/RBACGuard";
import ConnectTelegramButton from "@/components/ConnectTelegramButton";
import Image from "next/image";

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 9500) return { label: "S", color: "text-amber-400" };
  if (score >= 9000) return { label: "A", color: "text-emerald-400" };
  if (score >= 8500) return { label: "B", color: "text-[#38bdf8]" };
  if (score >= 8000) return { label: "C", color: "text-white/60" };
  if (score >= 7000) return { label: "D", color: "text-amber-400/70" };
  return { label: "F", color: "text-red-400" };
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.2)" }}
      transition={{ duration: 0.2 }}
      className="rounded-xl bg-[#050810]/60 border border-white/10 px-4 py-3 cursor-pointer"
    >
      <p className="text-[11px] text-white/40 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white text-[15px] font-medium">{value}</p>
    </motion.div>
  );
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = BigInt(params?.id as string);
  const agentIdNum = Number(agentId);

  const { data: profileRaw, isLoading, isError } = useAgentProfile(agentId);
  const { data: skillIds } = useAgentSkills(agentId);
  const { profile: supabaseProfile } = useSupabaseAgentProfile(agentIdNum);

  // Merge: on-chain profile + Supabase profile
  const profile = profileRaw as any;
  const agentWallet = profile?.agentWallet;
  const displayName = supabaseProfile?.display_name || `Agent #${agentIdNum}`;
  const bio = supabaseProfile?.bio;
  const avatarUrl = supabaseProfile?.avatar_url;
  const tags = supabaseProfile?.tags || [];

  if (isLoading) {
    return (
      <RBACGuard >
        <div className="max-w-3xl">
        <div className="mb-6">
          <div className="w-32 h-4 bg-white/5 rounded animate-pulse mb-4" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6">
          <div className="space-y-4">
            <div className="w-48 h-6 bg-white/5 rounded animate-pulse" />
            <div className="w-full h-20 bg-white/5 rounded animate-pulse" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
      </RBACGuard>
    );
  }

  if (isError || !profile) {
    return (
      <RBACGuard>
        <div className="max-w-3xl">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] mb-6 transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-8 text-center">
          <p className="text-red-400/70 text-[14px]">Failed to load agent profile.</p>
        </div>
      </div>
      </RBACGuard>
    );
  }

  const score = Number(profile.overallScore || 0);
  const scoreInfo = getScoreLabel(score);
  const skills = (skillIds as string[]) || [];
  const jobCount = Number(profile.totalJobsCompleted || 0);
  const agentWalletStr = profile?.agentWallet || "";

  return (
    <RBACGuard>
      <div className="max-w-3xl">
      {/* Back navigation */}
      <Link
        href="/dashboard?tab=agents"
        className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] mb-6 transition-colors"
      >
        ← Back to My Agents
      </Link>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mb-6"
      >
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar */}
          {avatarUrl ? (
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
              <Image
                src={avatarUrl}
                alt={displayName}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarGradient(Number(agentId))} flex items-center justify-center text-white text-[18px] font-bold flex-shrink-0`}>
              #{Number(agentId)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-medium text-white">{displayName}</h1>
              <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${profile.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                {profile.isActive ? "Active" : "Inactive"}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold ${scoreInfo.color} bg-white/5`}>
                {scoreInfo.label}-Tier
              </span>
            </div>
            <p className="text-white/40 text-[13px] font-mono">
              Wallet: {profile.agentWallet?.slice(0, 10)}...{profile.agentWallet?.slice(-6)}
            </p>
            <p className="text-white/40 text-[12px] font-mono mt-0.5">
              Owner: {profile.owner?.slice(0, 10)}...{profile.owner?.slice(-6)}
            </p>
            {bio && (
              <p className="text-white/50 text-[13px] mt-2 leading-relaxed">{bio}</p>
            )}
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-white/40">Overall Reputation Score</span>
            <span className="text-white font-medium text-[14px]">{(score / 100).toFixed(2)}/100</span>
          </div>
          <div className="h-2 bg-[#050810]/80 border border-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, score / 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#38bdf8] to-[#22d3ee] rounded-full"
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Default Rate" value={formatOG(BigInt(profile.defaultRate || 0)) + " OG"} />
          <StatCard label="Jobs Completed" value={Number(profile.totalJobsCompleted || 0).toString()} />
          <StatCard label="Jobs Attempted" value={Number(profile.totalJobsAttempted || 0).toString()} />
          <StatCard label="Total Earnings" value={formatOG(BigInt(profile.totalEarningsWei || 0)) + " OG"} />
        </div>
      </motion.div>

      {/* Skills section */}
      {skills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mb-6"
        >
          <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-3">
            Skills ({skills.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skillId: string) => (
              <span
                key={skillId}
                className="px-3 py-1.5 rounded-lg bg-[#050810]/60 border border-white/10 text-[12px] text-white/60"
              >
                {SKILL_LABELS[skillId] || skillId.slice(0, 10) + "..."}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* CIDs section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mb-6"
      >
        <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-3">
          On-Chain Data
        </h2>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-white/40">Profile CID</span>
            <span className="text-white/60 font-mono text-[12px]">
              {profile.profileCID || "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Capability CID</span>
            <span className="text-white/60 font-mono text-[12px]">
              {profile.capabilityCID || "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Created</span>
            <span className="text-white/60">
              {profile.createdAt ? new Date(Number(profile.createdAt) * 1000).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Telegram connect */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.17 }}
        className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5 mb-6"
      >
        <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-3">
          Notifications
        </h2>
        <ConnectTelegramButton />
      </motion.div>

      {/* Agent Memory — learnings from past client interactions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.18 }}
        className="mb-6"
      >
      </motion.div>

      {/* Agent Activity — real-time log of what this agent is doing */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-6"
      >
      </motion.div>

      {/* Job history */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6"
      >
        <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-3">
          Job History
        </h2>
        {jobCount === 0 ? (
          <div className="text-center py-6">
            <p className="text-white/30 text-[13px] mb-1">No jobs completed yet</p>
            <p className="text-white/20 text-[12px]">
              When your agent accepts jobs, they will appear here with live status updates.
            </p>
          </div>
        ) : (
          <p className="text-white/40 text-[13px] text-center py-4">
            {jobCount} job{jobCount > 1 ? "s" : ""} completed.
            <Link href="/dashboard/my-proposals" className="text-[#38bdf8] ml-1 hover:underline">View all →</Link>
          </p>
        )}
      </motion.div>
    </div>
    </RBACGuard>
  );
}
