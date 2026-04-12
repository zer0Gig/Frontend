"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWalletClient } from "wagmi";
import { createPublicClient, http, parseEther } from "viem";
import { supabase } from "@/lib/supabase";
import { useAllAgents } from "@/hooks/useAllAgents";
import { useAgentProfile } from "@/hooks/useAgentProfile";
import { useCreateSubscription } from "@/hooks/useSubscriptionEscrow";
import { ogNewton } from "@/lib/wagmi";
import { formatOG } from "@/lib/utils";
import { AgentStatsCard } from "@/components/subscriptions/AgentStatsCard";
import type { AgentListing } from "@/hooks/useAllAgents";

interface Proposal {
  id: string;
  agent_id: number;
  client_address: string;
  task_description: string;
  check_in_rate: string;
  status: string;
  created_at: string;
  metadata?: {
    rate_og?: string;
  };
}

interface AgentStats {
  agent_id: number;
  llm_provider: string | null;
  llm_model: string | null;
  self_improvement_rate: number | null;
  tasks_done: number | null;
  success_rate: number | null;
  skills_count: number | null;
}

function ProposalCard({
  proposal,
  isSelected,
  onClick,
  index,
}: {
  proposal: Proposal;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const rate = proposal.metadata?.rate_og || proposal.check_in_rate;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        isSelected
          ? "bg-[#050810]/90 border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.1)]"
          : "bg-[#0d1525]/60 border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
          #{proposal.agent_id}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[14px] font-medium truncate">
            Agent #{proposal.agent_id}
          </p>
          <p className="text-white/40 text-[12px] truncate">
            {proposal.task_description || "No description"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-sky-400 text-[13px] font-medium">
            {formatOG(BigInt(rate))} OG
          </span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
              proposal.status === "pending"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : "bg-white/10 text-white/40"
            }`}
          >
            {proposal.status}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function AgentDetailPanel({
  agentId,
  stats,
  profile,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  approveError,
}: {
  agentId: number;
  stats: AgentStats | null;
  profile: { display_name?: string | null; avatar_url?: string | null; bio?: string | null } | null;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
  approveError: string | null;
}) {
  const name = profile?.display_name || `Agent #${agentId}`;
  const avatarUrl = profile?.avatar_url;
  const initials = name.slice(0, 2).toUpperCase();

  const improvementRate = stats?.self_improvement_rate ?? 0;
  const tasksDone = stats?.tasks_done ?? 0;
  const successRate = stats?.success_rate ?? 0;
  const skillsCount = stats?.skills_count ?? 0;
  const provider = stats?.llm_provider || "Unknown";
  const model = stats?.llm_model || "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-white/10 bg-[#0d1525]/90 overflow-hidden"
    >
      <div className="h-[2px] bg-gradient-to-r from-sky-400 to-cyan-400" />

      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-[17px] font-bold text-white flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-[18px] leading-tight mb-1">{name}</h3>
            <p className="text-white/40 text-[12px]">
              {provider} · {model}
            </p>
          </div>
        </div>

        {profile?.bio && (
          <p className="text-white/50 text-[13px] leading-relaxed mb-5">
            {profile.bio}
          </p>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between text-[12px] mb-2">
              <span className="text-white/40">Self-Improvement Rate</span>
              <span className="text-white font-medium">{improvementRate}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, improvementRate)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#050810]/60 border border-white/10 rounded-xl px-4 py-3">
              <span className="text-[11px] text-white/30 block mb-0.5">Tasks Done</span>
              <span className="text-[17px] text-white font-semibold">{tasksDone}</span>
            </div>
            <div className="bg-[#050810]/60 border border-white/10 rounded-xl px-4 py-3">
              <span className="text-[11px] text-white/30 block mb-0.5">Success Rate</span>
              <span className="text-[17px] text-emerald-400 font-semibold">{successRate}%</span>
            </div>
          </div>

          <div className="bg-[#050810]/60 border border-white/10 rounded-xl px-4 py-3">
            <span className="text-[11px] text-white/30 block mb-0.5">Skills Count</span>
            <span className="text-[17px] text-white font-semibold">{skillsCount}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onApprove}
            disabled={isApproving}
            className="flex-1 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[14px] font-medium rounded-xl hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            {isApproving ? "Approving..." : "Approve"}
          </button>
          <button
            onClick={onReject}
            disabled={isRejecting}
            className="flex-1 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 text-[14px] font-medium rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {isRejecting ? "Rejecting..." : "Reject"}
          </button>
        </div>

        {approveError && (
          <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
            <p className="text-red-400 text-[12px]">{approveError}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ProposalsPage() {
  const params = useParams();
  const subId = params?.id as string;

  const { data: walletClient } = useWalletClient();
  const walletAddress = walletClient?.account.address;

  const { createSubscription } = useCreateSubscription();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);

  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const { agents } = useAllAgents();
  const { profile: agentProfile } = useAgentProfile(
    selectedProposal ? BigInt(selectedProposal.agent_id) : undefined
  );

  useEffect(() => {
    if (!walletAddress) return;
    setIsLoadingProposals(true);

    supabase
      .from("subscription_proposals")
      .select("*")
      .eq("client_address", walletAddress.toLowerCase())
      .eq("status", "pending")
      .then(({ data, error }) => {
        if (!error && data) {
          setProposals(data as Proposal[]);
        }
        setIsLoadingProposals(false);
      });
  }, [walletAddress]);

  useEffect(() => {
    if (!selectedProposal) {
      setAgentStats(null);
      return;
    }

    setIsLoadingStats(true);
    supabase
      .from("agent_proposal_stats")
      .select("*")
      .eq("agent_id", selectedProposal.agent_id)
      .single()
      .then(({ data }) => {
        setAgentStats((data as AgentStats) ?? null);
        setIsLoadingStats(false);
      });
  }, [selectedProposal]);

  const handleApprove = async () => {
    if (!selectedProposal || !walletAddress) return;
    setIsApproving(true);
    setApproveError(null);

    try {
      const rateStr = selectedProposal.metadata?.rate_og || selectedProposal.check_in_rate;
      const rateWei = parseFloat(rateStr) > 0 ? parseEther(rateStr) : 0n;

      const txHash = await createSubscription(
        BigInt(selectedProposal.agent_id),
        selectedProposal.task_description,
        86400n,
        rateWei,
        0n,
        300n,
        false,
        0,
        "0x" as `0x${string}`,
        "",
        rateWei
      );

      if (txHash) {
        const publicClient = createPublicClient({
          chain: ogNewton,
          transport: http(),
        });
        await publicClient.waitForTransactionReceipt({ hash: txHash, confirmations: 1 });
      }

      await supabase
        .from("subscription_proposals")
        .update({ status: "approved" })
        .eq("id", selectedProposal.id);

      setProposals((prev) => prev.filter((p) => p.id !== selectedProposal.id));
      setSelectedProposal(null);
    } catch (err: any) {
      setApproveError(err?.message || "Transaction failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProposal) return;
    setIsRejecting(true);

    try {
      await supabase
        .from("subscription_proposals")
        .update({ status: "rejected" })
        .eq("id", selectedProposal.id);

      setProposals((prev) => prev.filter((p) => p.id !== selectedProposal.id));
      setSelectedProposal(null);
    } finally {
      setIsRejecting(false);
    }
  };

  const agent = agents.find((a) => a.agentId === selectedProposal?.agent_id) as AgentListing | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] mb-6 transition-colors"
      >
        ← Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white mb-1">Agent Proposals</h1>
        <p className="text-white/40 text-[14px]">
          Review and approve agent proposals for this subscription
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[380px] flex-shrink-0">
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-4">
            <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-3">
              Proposals ({proposals.length})
            </h2>

            {isLoadingProposals ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : proposals.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-white/40 text-[13px]">No pending proposals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((proposal, index) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    isSelected={selectedProposal?.id === proposal.id}
                    onClick={() => setSelectedProposal(proposal)}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {!selectedProposal ? (
            <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-8 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <p className="text-white/40 text-[14px]">
                  Select a proposal to view agent details
                </p>
              </div>
            </div>
          ) : isLoadingStats ? (
            <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl animate-pulse" />
                  <div className="space-y-2">
                    <div className="w-32 h-5 bg-white/5 rounded animate-pulse" />
                    <div className="w-24 h-4 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-1.5 bg-white/5 rounded-full animate-pulse" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ) : agent ? (
            <AgentStatsCard
              agentId={agent.agentId}
              agent={agent}
              profile={agentProfile}
              isSelected={true}
            />
          ) : (
            <AgentDetailPanel
              agentId={selectedProposal.agent_id}
              stats={agentStats}
              profile={agentProfile}
              onApprove={handleApprove}
              onReject={handleReject}
              isApproving={isApproving}
              isRejecting={isRejecting}
              approveError={approveError}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}