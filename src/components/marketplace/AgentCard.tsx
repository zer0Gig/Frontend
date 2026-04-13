import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { AgentListing } from "@/hooks/useAllAgents";
import { AgentProfile } from "@/lib/supabase";
import { useWalletClient } from "wagmi";

interface AgentCardProps {
  agent:     AgentListing;
  profile:   AgentProfile | null;
  index:     number;
  isMyAgent?: boolean;
}

const AVATAR_GRADIENTS = [
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-500",
];

function getRuntimeBadge(capabilityCID: string) {
  if (capabilityCID.startsWith("pm:")) return { label: "Platform", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" };
  if (capabilityCID.startsWith("sh:")) return { label: "Self-Hosted", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" };
  return null;
}

export function AgentCard({ agent, profile, index, isMyAgent: isMyAgentProp }: AgentCardProps) {
  const { data: walletClient } = useWalletClient();
  const connectedWallet = walletClient?.account.address;
  const isMyAgent = isMyAgentProp ?? (connectedWallet?.toLowerCase() === agent.agentWallet?.toLowerCase());

  const gradient   = AVATAR_GRADIENTS[agent.agentId % AVATAR_GRADIENTS.length];
  const runtime    = getRuntimeBadge(agent.capabilityCID);
  const displayName = profile?.display_name ?? `Agent #${agent.agentId}`;
  const bio         = profile?.bio;
  const avatarUrl   = profile?.avatar_url;
  const featured    = profile?.featured ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`relative rounded-2xl border bg-[#0d1525]/90 p-6 hover:border-white/20 transition-all duration-200 flex flex-col gap-4 ${
        featured ? "border-[#38bdf8]/30 shadow-[0_0_24px_rgba(56,189,248,0.07)]" : "border-white/10"
      }`}
    >
      {/* Featured badge */}
      {featured && (
        <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
          Featured
        </div>
      )}

      {/* Header: avatar + name + status */}
      <div className={`flex items-start gap-3 ${featured ? "pr-16" : ""}`}>
        {/* Avatar */}
        <div className="shrink-0">
          {avatarUrl ? (
            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
              <Image
                src={avatarUrl}
                alt={displayName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
              <span className="text-white text-[13px] font-bold">#{agent.agentId}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-[16px] truncate">{displayName}</h3>
            {runtime && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${runtime.color}`}>
                {runtime.label}
              </span>
            )}
          </div>
          <p className="text-white/35 text-[12px] font-mono mt-0.5">
            {agent.agentWallet.slice(0, 6)}...{agent.agentWallet.slice(-4)}
          </p>
        </div>

        {/* Active badge - moves below name when featured to avoid overlap */}
        {featured ? (
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-emerald-500/10 text-emerald-400 mt-6">
            Active
          </span>
        ) : (
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] ${agent.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {agent.isActive ? "Active" : "Inactive"}
          </span>
        )}
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-white/45 text-[13px] leading-relaxed line-clamp-2 -mt-1">
          {bio}
        </p>
      )}

      {/* Reputation bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-white/35 uppercase tracking-wide">Reputation</span>
          <span className="text-white font-medium text-[12px]">{agent.scoreDisplay}/100</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#22d3ee] transition-all duration-700"
            style={{ width: `${agent.overallScore / 100}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#050810]/60 rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-white/30 uppercase tracking-wide mb-0.5">Rate / Task</p>
          <p className="text-[15px] text-white font-semibold">{agent.rateDisplay}</p>
        </div>
        <div className="bg-[#050810]/60 rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-white/30 uppercase tracking-wide mb-0.5">Jobs Done</p>
          <p className="text-[15px] text-white font-semibold">{agent.totalJobsCompleted}</p>
        </div>
      </div>

      {/* Skills */}
      {agent.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {agent.skills.slice(0, 5).map((skill, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50">
              {skill}
            </span>
          ))}
          {agent.skills.length > 5 && (
            <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/30">
              +{agent.skills.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Link
          href={`/dashboard/create-job?agent=${agent.agentId}`}
          className="flex-1 px-4 py-2 bg-white text-black text-[13px] font-medium rounded-full text-center hover:bg-white/90 transition-colors"
        >
          Hire Agent
        </Link>
        <Link
          href={`/dashboard/create-subscription?agent=${agent.agentId}`}
          className="flex-1 px-4 py-2 bg-[#0d1525]/90 border border-white/20 text-white text-[13px] font-medium rounded-full text-center hover:border-white/40 transition-colors"
        >
          Subscribe
        </Link>
      </div>
    </motion.div>
  );
}
