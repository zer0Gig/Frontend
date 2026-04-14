"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { parseContractError } from "@/lib/utils";
import { useAccount } from "wagmi";
import {
  useJobDetails,
  useJobProposals,
  useAcceptProposal,
  useSubmitProposal,
  useDefineMilestones,
  type JobData,
  type ProposalData,
} from "@/hooks/useProgressiveEscrow";
import { useAgentProfile, useOwnerAgents, useHasSkill } from "@/hooks/useAgentRegistry";
import { SKILL_LABELS } from "@/hooks/useAgentManagement";
import { useAllAgents } from "@/hooks/useAllAgents";
import { useAgentProfile as useSupabaseAgentProfile, useAgentProfiles } from "@/hooks/useAgentProfile";
import { supabase } from "@/lib/supabase";
import { useUserRole, UserRole } from "@/hooks/useUserRegistry";
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import { formatOG, formatRelativeTime } from "@/lib/utils";
import { X, Zap, Circle } from "lucide-react";
import { keccak256, toBytes } from "viem";
import { type Address } from "viem";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import SystemMessageLog from "@/components/jobs/SystemMessageLog";
import MilestoneBuilder from "@/components/jobs/MilestoneBuilder";
import FuturisticSelect, { SelectOption } from "@/components/ui/FuturisticSelect";
import { AgentStatsCard } from "@/components/subscriptions/AgentStatsCard";
import AgentActivityByWallet from "@/components/jobs/AgentActivityByWallet";
import JobChat from "@/components/jobs/JobChat";

// ─── Status helpers ───────────────────────────────────────────────────────────
// Job status enum: 0=OPEN, 1=PENDING_MILESTONES, 2=IN_PROGRESS, 3=COMPLETED, 4=CANCELLED, 5=PARTIALLY_DONE
const JOB_STATUS = {
  OPEN: 0,
  PENDING_MILESTONES: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  PARTIALLY_DONE: 5,
} as const;

const getStatusBadge = (status: number) => {
  const statusMap: Record<number, { bg: string; text: string; label: string }> = {
    0: { bg: "bg-[#38bdf8]/10", text: "text-[#38bdf8]", label: "Open" },
    1: { bg: "bg-white/10", text: "text-white/60", label: "Pending Setup" },
    2: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "In Progress" },
    3: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Completed" },
    4: { bg: "bg-red-500/10", text: "text-red-400", label: "Cancelled" },
    5: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Partial" },
  };
  return statusMap[status] ?? statusMap[0];
};

// ─── Slide-in agent stats panel (right side) ────────────────────────────────

function AgentStatsSlidePanel({
  agentId,
  onClose,
}: {
  agentId: bigint;
  onClose: () => void;
}) {
  const numId = Number(agentId);
  const { agents } = useAllAgents(false);
  const agent = agents.find(a => a.agentId === numId) ?? null;
  const { profile } = useSupabaseAgentProfile(numId);

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
      className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0d1525]/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0d1525]/95 backdrop-blur-xl flex-shrink-0">
        <h3 className="text-[14px] font-medium text-white/60 uppercase tracking-wider">Agent Stats</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content — uses shared AgentStatsCard */}
      <div className="p-4">
        <AgentStatsCard agentId={numId} agent={agent} profile={profile} />
      </div>
    </motion.div>
  );
}

// ─── Proposal card (client view) ─────────────────────────────────────────────

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

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  "0g-compute": <Zap size={16} className="text-yellow-400" />,
  openai: <Circle size={16} className="text-blue-500" fill="currentColor" />,
  anthropic: <Circle size={16} className="text-red-500" fill="currentColor" />,
  groq: <Circle size={16} className="text-orange-500" fill="currentColor" />,
  openrouter: <Circle size={16} className="text-indigo-500" fill="currentColor" />,
  alibaba: <Circle size={16} className="text-orange-600" fill="currentColor" />,
  google: <Circle size={16} className="text-green-500" fill="currentColor" />,
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

function ProposalCard({
  proposal,
  index,
  jobId,
  isClient,
  onAccepted,
}: {
  proposal: ProposalData;
  index: number;
  jobId: number;
  isClient: boolean;
  onAccepted: () => void;
}) {
  const { acceptProposal, isPending, isConfirming, isConfirmed, error } = useAcceptProposal();
  const { data: agentRaw } = useAgentProfile(BigInt(proposal.agentId));
  const { profile: supabaseProfile } = useSupabaseAgentProfile(Number(proposal.agentId));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agent = agentRaw as any;
  const displayName = supabaseProfile?.display_name || `Agent #${proposal.agentId.toString()}`;

  const [showStats, setShowStats] = useState(false);

  if (isConfirmed) {
    onAccepted();
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`bg-[#050810]/60 rounded-xl border p-4 ${proposal.accepted ? "border-emerald-500/30" : "border-white/10"}`}
    >
      {/* ── Header: name, wallet, rate ──────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 overflow-hidden">
            {supabaseProfile?.avatar_url ? (
              <img src={supabaseProfile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-white text-[14px] font-medium">{displayName}</span>
              {proposal.accepted && (
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Accepted
                </span>
              )}
            </div>
            <p className="text-white/40 text-[12px] font-mono">
              {proposal.agentOwner?.slice(0, 6)}...{proposal.agentOwner?.slice(-4)}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-white text-[16px] font-medium">{formatOG(proposal.proposedRateWei)} OG</p>
          <p className="text-white/30 text-[12px]">proposed rate</p>
        </div>
      </div>

      {/* ── On-chain score / jobs ───────────────────────────────────────── */}
      {agent && (
        <div className="flex gap-4 mb-3 text-[12px] text-white/50">
          <span>Score: <span className="text-white/70">{agent.overallScore ? (Number(agent.overallScore) / 100).toFixed(0) : "\u2014"}/100</span></span>
          <span>Jobs: <span className="text-white/70">{agent.totalJobsCompleted?.toString() ?? "0"}</span></span>
        </div>
      )}

      {/* ── View Stats button ───────────────────────────────────────────── */}
      <button
        onClick={() => setShowStats(true)}
        className="w-full mb-3 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[12px] text-white/50 font-medium hover:bg-white/[0.08] hover:text-white/70 hover:border-white/15 transition-all flex items-center justify-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        View Agent Stats
      </button>

      {/* ── Proposal description ────────────────────────────────────────── */}
      {proposal.descriptionCID && (
        <p className="text-white/50 text-[13px] mb-4 line-clamp-3">
          Proposal ref: <span className="font-mono text-[11px] text-white/30">{proposal.descriptionCID.slice(0, 16)}...</span>
        </p>
      )}

      <p className="text-white/30 text-[11px] mb-4">
        Submitted {formatRelativeTime(Number(proposal.submittedAt))}
      </p>

      {/* ── Accept button ───────────────────────────────────────────────── */}
      {isClient && !proposal.accepted && (
        <>
          {error && (
            <p className="text-red-400 text-[12px] mb-2">{parseContractError(error)}</p>
          )}
          <button
            onClick={() => acceptProposal({ jobId: BigInt(jobId), proposalIndex: BigInt(index), value: proposal.proposedRateWei })}
            disabled={isPending || isConfirming}
            className="w-full px-4 py-2 bg-white text-black text-[13px] font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Confirm in wallet..." : isConfirming ? "Accepting..." : `Accept \u2014 ${formatOG(proposal.proposedRateWei)} OG`}
          </button>
        </>
      )}
    </motion.div>

    {/* ── Slide-in stats panel ──────────────────────────────────────────── */}
    <AnimatePresence>
      {showStats && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStats(false)}
            className="fixed inset-0 bg-black/40 z-40"
          />
          {/* Panel */}
          <AgentStatsSlidePanel
            agentId={BigInt(proposal.agentId)}
            onClose={() => setShowStats(false)}
          />
        </>
      )}
    </AnimatePresence>
    </>
  );
}

// ─── Submit Proposal form (agent view) ───────────────────────────────────────
function SubmitProposalPanel({
  jobId,
  ownerAddress,
  onSubmitted,
}: {
  jobId: number;
  ownerAddress: Address;
  onSubmitted: () => void;
}) {
  const router = useRouter();
  const { data: agentIdsRaw } = useOwnerAgents(ownerAddress);
  const agentIds = agentIdsRaw as bigint[] | undefined;
  const agentIdNums = agentIds?.map(id => Number(id)) || [];
  const { profiles } = useAgentProfiles(agentIdNums);

  const [selectedAgent, setSelectedAgent] = useState("");
  const [rateOG, setRateOG] = useState("");
  const [description, setDescription] = useState("");

  const { submitProposal, isPending, isConfirming, isConfirmed, error } = useSubmitProposal();

  // Skill validation: read job's required skill, check if selected agent has it
  const { data: jobRawForSkill } = useJobDetails(jobId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobForSkill = jobRawForSkill as any;
  const requiredSkillId: string | undefined = jobForSkill?.skillId;
  const ZERO_SKILL = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const hasSkillReq = !!requiredSkillId && requiredSkillId !== ZERO_SKILL;
  const requiredSkillLabel = hasSkillReq ? (SKILL_LABELS[requiredSkillId!] || `Skill ${requiredSkillId?.slice(0, 10)}...`) : null;
  const { data: agentHasSkill } = useHasSkill(
    selectedAgent ? BigInt(selectedAgent) : undefined,
    hasSkillReq ? requiredSkillId : undefined
  );
  const skillBlocked = hasSkillReq && selectedAgent && agentHasSkill === false;

  // Redirect after confirmation
  useEffect(() => {
    if (isConfirmed) {
      onSubmitted();
      const t = setTimeout(() => router.push("/dashboard/my-proposals"), 1800);
      return () => clearTimeout(t);
    }
  }, [isConfirmed, onSubmitted, router]);

  const handleSubmit = () => {
    if (!selectedAgent || !rateOG || !description) return;
    const rateWei = BigInt(Math.floor(parseFloat(rateOG) * 1e18));
    const descCID = keccak256(toBytes(description));
    submitProposal({ jobId: BigInt(jobId), agentId: BigInt(selectedAgent), proposedRateWei: rateWei, descriptionCID: descCID });
  };

  // Show success state with redirect
  if (isConfirmed) {
    return (
      <div className="bg-[#0d1525]/90 rounded-2xl border border-emerald-500/20 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-emerald-400 text-[14px] font-medium">Proposal Submitted!</p>
            <p className="text-white/40 text-[12px]">Redirecting to your proposals page...</p>
          </div>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-emerald-400/60 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (!agentIds || agentIds.length === 0) {
    return (
      <div className="bg-[#0d1525]/90 rounded-2xl border border-white/10 p-6">
        <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-4">Submit a Proposal</h2>
        <p className="text-white/40 text-[13px]">
          You don&apos;t have any registered agents.{" "}
          <Link href="/dashboard/register-agent" className="text-[#38bdf8] hover:underline">Register one</Link> to propose.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1525]/90 rounded-2xl border border-white/10 p-6">
      <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-6">Submit a Proposal</h2>

      <div className="space-y-5">
        {/* Required skill banner */}
        {hasSkillReq && (
          <div className="rounded-xl bg-[#38bdf8]/5 border border-[#38bdf8]/15 px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#38bdf8] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <p className="text-[#38bdf8]/80 text-[12px]">
              Required skill: <span className="font-semibold text-[#38bdf8]">{requiredSkillLabel}</span>. Your agent must have this skill registered.
            </p>
          </div>
        )}

        <div>
          <label className="block text-white/40 text-[13px] mb-2">Your Agent</label>
          <FuturisticSelect
            options={[
              { value: "", label: "Select agent…" },
              ...agentIds.map((id) => {
                const num = Number(id);
                const p = profiles[num];
                const name = p?.display_name || `Agent #${num}`;
                return { value: id.toString(), label: name };
              }),
            ]}
            value={selectedAgent}
            onChange={setSelectedAgent}
            placeholder="Select agent…"
            width="w-full"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
            }
          />
          {skillBlocked && (
            <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-[12px]">
                This agent doesn&apos;t have the <strong>{requiredSkillLabel}</strong> skill. The transaction will fail. Re-register the agent with this skill, or choose a different agent.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-white/40 text-[13px] mb-2">Proposed Rate (OG)</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={rateOG}
            onChange={(e) => setRateOG(e.target.value)}
            placeholder="e.g. 0.05"
            className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
          {rateOG && !isNaN(parseFloat(rateOG)) && parseFloat(rateOG) > 0 && (
            <p className="text-[12px] text-white/40 mt-1">
              = {(parseFloat(rateOG) * 1e18).toLocaleString()} wei
            </p>
          )}
        </div>

        <div>
          <label className="block text-white/40 text-[13px] mb-2">Cover Letter / Approach</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your approach, relevant experience, and why you're a good fit for this job."
            className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
          />
        </div>

        {error && (
          <p className="text-red-400 text-[12px]">{parseContractError(error)}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending || isConfirming || !selectedAgent || !rateOG || !description || !!skillBlocked}
          className="w-full px-6 py-3 bg-white text-black text-[14px] font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Confirm in wallet..." : isConfirming ? "Submitting..." : "Submit Proposal"}
        </button>
      </div>
    </div>
  );
}

// ─── Milestone builder panel (client, PENDING_MILESTONES status) ─────────────
function DefineMilestonesPanel({ jobId, onDefined }: { jobId: number; onDefined: () => void }) {
  const { defineMilestones, isPending, isSuccess } = useDefineMilestones();

  if (isSuccess) {
    onDefined();
  }

  return (
    <div className="bg-[#0d1525]/90 rounded-2xl border border-white/10 p-6">
      <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-2">Define Milestones</h2>
      <p className="text-white/40 text-[13px] mb-6">
        Break the project into milestones. Each milestone releases a percentage of the budget when approved.
      </p>
      <MilestoneBuilder
        onSubmit={(percentages, criteria) => {
          const total = percentages.reduce((sum, p) => sum + p, 0);
          if (total !== 100) {
            alert(`Percentages must sum to 100. Current total: ${total}`);
            return;
          }
          if (!percentages.every(p => Number.isInteger(p))) {
            alert("Percentages must be whole numbers (integers)");
            return;
          }
          const hashes = criteria.map((c) => keccak256(toBytes(c)));
          defineMilestones({ jobId: BigInt(jobId), percentages, criteriaHashes: hashes });
        }}
        isPending={isPending}
      />
    </div>
  );
}

// ─── Milestone timeline ───────────────────────────────────────────────────────
function MilestoneTimeline({
  jobId,
  milestoneCount,
  totalBudgetWei,
}: {
  jobId: number;
  milestoneCount: number;
  totalBudgetWei: bigint;
}) {
  const contracts = Array.from({ length: milestoneCount }, (_, i) => ({
    address: CONTRACT_CONFIG.ProgressiveEscrow.address,
    abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
    functionName: "getMilestone",
    args: [BigInt(jobId), i],
  }));

  const { data: milestones, isLoading, isError } = useReadContracts({
    contracts,
    allowFailure: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !milestones || milestones.length === 0) {
    return <p className="text-white/30 text-center py-6">Failed to load milestones</p>;
  }

  const getStatusDotStyles = (status: number) => {
    const statusMap: Record<number, string> = {
      0: "border-white/20 bg-transparent",
      1: "border-yellow-400/50 bg-yellow-400/10",
      2: "border-emerald-400/50 bg-emerald-400/10",
      3: "border-red-400/50 bg-red-400/10",
      4: "border-amber-400/50 bg-amber-400/10",
    };
    return statusMap[status] ?? statusMap[0];
  };

  const getMilestoneBadge = (status: number) => {
    const statusMap: Record<number, { bg: string; text: string; label: string }> = {
      0: { bg: "bg-white/10", text: "text-white/60", label: "Pending" },
      1: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Submitted" },
      2: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Approved" },
      3: { bg: "bg-red-500/10", text: "text-red-400", label: "Rejected" },
      4: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Retrying" },
    };
    return statusMap[status] ?? statusMap[0];
  };

  return (
    <div className="space-y-6">
      {milestones.map((milestone, index) => {
        if (!milestone || !milestone.result) return null;
        const result = milestone.result as { percentage: bigint; amountWei: bigint; status: number; outputCID: string; alignmentScore: bigint; retryCount: bigint; [key: string]: unknown };
        const { percentage, amountWei, status, outputCID, alignmentScore, retryCount } = result;
        const statusDotStyle = getStatusDotStyles(status);
        const statusBadge = getMilestoneBadge(status);

        return (
          <div key={index} className="relative flex gap-4">
            {index < milestoneCount - 1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px bg-white/10" />
            )}
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 border ${statusDotStyle}`}>
              {status === 2 && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {status === 3 && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              {(status === 1 || status === 4) && (
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
              )}
              {status === 0 && <div className="w-2 h-2 bg-white/30 rounded-full" />}
            </div>

            <div className="flex-1 pb-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-[14px] font-medium">
                  Milestone {index + 1} — {Number(percentage)}%
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[12px] ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-white/50 text-[13px]">{formatOG(amountWei)} OG</p>
              {status >= 1 && (
                <p className="text-white/40 text-[12px] mt-1">
                  Alignment score: {(Number(alignmentScore) / 100).toFixed(2)}/100
                </p>
              )}
              {outputCID && (
                <p className="text-[#38bdf8] text-[12px] mt-1 font-mono truncate">
                  Output: {outputCID.slice(0, 20)}...
                </p>
              )}
              {retryCount > 0n && (
                <p className="text-amber-400/70 text-[12px] mt-1">Retry {retryCount.toString()}/5</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Inner page (uses useSearchParams) ───────────────────────────────────────
function JobDetailInner({ jobId }: { jobId: number }) {
  const searchParams = useSearchParams();
  const isNew = searchParams?.get("new") === "1";
  const router = useRouter();
  const { address } = useAccount();
  const { role } = useUserRole(address as Address | undefined);

  const { data: jobRaw, isLoading, isError, refetch } = useJobDetails(jobId);
  const job = jobRaw as unknown as JobData | undefined;

  const { proposals, isLoading: proposalsLoading, refetch: refetchProposals } = useJobProposals(jobId);

  const { writeContract, isPending: isCancelPending, data: cancelTxHash } = useWriteContract();
  const { isSuccess: isCancelConfirmed } = useWaitForTransactionReceipt({ hash: cancelTxHash });

  if (isCancelConfirmed) {
    refetch();
  }

  const handleCancelJob = () => {
    writeContract({
      address: CONTRACT_CONFIG.ProgressiveEscrow.address as Address,
      abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
      functionName: "cancelJob",
      args: [BigInt(jobId)],
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-[#050810] min-h-screen">
        <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 animate-pulse">
          <div className="h-6 bg-white/10 rounded-lg mb-4 w-48" />
          <div className="h-4 bg-white/10 rounded-lg mb-2 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 mt-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-white/10 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-[#050810] min-h-screen">
        <div className="text-white/30 text-center py-20">
          {isError ? "Failed to load job. Check the job ID." : "Job not found."}
        </div>
      </div>
    );
  }

  const status = getStatusBadge(job.status);
  const isClient = address?.toLowerCase() === job.client?.toLowerCase();
  const isAgentOwner = role === UserRole.FreelancerOwner;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#050810] min-h-screen">
      {/* Back navigation */}
      <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] mb-6 transition-colors">
        ← Back to Dashboard
      </Link>

      {/* New job success banner */}
      {isNew && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 mb-6 flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-emerald-400 text-[13px]">
            Job #{jobId} posted! Agents can now browse and submit proposals.
          </span>
        </div>
      )}

      {/* Job header card */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-medium text-white">Job #{job.jobId.toString()}</h1>
              <span className={`px-2.5 py-1 rounded-full text-[12px] ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
            <p className="text-white/40 text-[13px] font-mono">
              Client: {job.client?.slice(0, 6)}...{job.client?.slice(-4)}
            </p>
          </div>
          {isClient && (job.status === JOB_STATUS.OPEN || job.status === JOB_STATUS.PENDING_MILESTONES) && (
            <button
              onClick={handleCancelJob}
              disabled={isCancelPending}
              className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] rounded-full hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCancelPending ? "Cancelling..." : "Cancel Job"}
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#050810]/60 rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-0.5">Agent</p>
            <p className="text-[15px] text-white font-medium">
              {job.agentId && job.agentId > 0n ? `#${job.agentId}` : "—"}
            </p>
          </div>
          <div className="bg-[#050810]/60 rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-0.5">Budget</p>
            <p className="text-[15px] text-white font-medium">
              {job.totalBudgetWei > 0n ? `${formatOG(job.totalBudgetWei)} OG` : "—"}
            </p>
          </div>
          <div className="bg-[#050810]/60 rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-0.5">Released</p>
            <p className="text-[15px] text-white font-medium">{formatOG(job.releasedWei)} OG</p>
          </div>
          <div className="bg-[#050810]/60 rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-0.5">Proposals</p>
            <p className="text-[15px] text-white font-medium">
              {job.status === JOB_STATUS.OPEN ? (proposals?.length ?? "—") : (job.milestoneCount?.toString() ?? "—")}
            </p>
          </div>
        </div>

        {/* Progress bar (only when in progress or beyond) */}
        {job.status >= JOB_STATUS.IN_PROGRESS && job.totalBudgetWei > 0n && (
          <div className="mt-4">
            <div className="flex justify-between text-[12px] mb-1.5">
              <span className="text-white/40">Progress</span>
              <span className="text-white/60">
                {Math.round(Number(job.releasedWei * 100n / job.totalBudgetWei))}%
              </span>
            </div>
            <div className="h-2 bg-[#050810]/80 border border-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Number(job.releasedWei * 100n / (job.totalBudgetWei || 1n)))}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#38bdf8] to-[#22d3ee] rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── OPEN status: proposals ── */}
      {job.status === JOB_STATUS.OPEN && (
        <>
          {/* Client: view proposals */}
          {isClient && (
            <div className="bg-[#0d1525]/90 rounded-2xl border border-white/10 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider">
                  Proposals ({proposals?.length ?? 0})
                </h2>
                {proposalsLoading && (
                  <span className="text-white/30 text-[12px]">Loading...</span>
                )}
              </div>

              {!proposals || proposals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-white/30 text-[13px]">No proposals yet. Agents will submit soon.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals.map((p, i) => (
                    <ProposalCard
                      key={i}
                      proposal={p}
                      index={i}
                      jobId={jobId}
                      isClient={isClient}
                      onAccepted={() => { refetch(); refetchProposals(); }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agent owner: submit proposal */}
          {isAgentOwner && !isClient && address && (
            <SubmitProposalPanel
              jobId={jobId}
              ownerAddress={address as Address}
              onSubmitted={() => refetchProposals()}
            />
          )}

          {/* Neither role or not connected */}
          {!isClient && !isAgentOwner && (
            <div className="bg-[#0d1525]/90 rounded-2xl border border-white/10 p-6 mb-6 text-center py-8">
              <p className="text-white/40 text-[13px]">
                Connect your wallet and register as a Freelancer Owner to submit proposals.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── PENDING_MILESTONES: accepted proposal info + milestone builder ── */}
      {job.status === JOB_STATUS.PENDING_MILESTONES && (
        <>
          {/* Accepted proposal summary */}
          <div className="bg-[#0d1525]/90 rounded-2xl border border-white/10 p-6 mb-6">
            <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-4">Accepted Proposal</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-[14px] font-medium mb-1">Agent #{job.agentId?.toString()}</p>
                <p className="text-white/40 text-[12px] font-mono">{job.agentWallet?.slice(0, 6)}...{job.agentWallet?.slice(-4)}</p>
              </div>
              <div className="text-right">
                <p className="text-white text-[16px] font-medium">{formatOG(job.totalBudgetWei)} OG</p>
                <p className="text-white/30 text-[12px]">deposited in escrow</p>
              </div>
            </div>
          </div>

          {/* Milestone builder for client */}
          {isClient && (
            <DefineMilestonesPanel jobId={jobId} onDefined={() => refetch()} />
          )}

          {!isClient && (
            <div className="bg-[#0d1525]/90 rounded-2xl border border-white/10 p-6 text-center py-8">
              <p className="text-white/40 text-[13px]">
                Waiting for the client to define project milestones.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── IN_PROGRESS / COMPLETED / PARTIALLY_DONE: milestone timeline ── */}
      {job.status >= JOB_STATUS.IN_PROGRESS && job.status !== JOB_STATUS.CANCELLED && (
        <>
          {/* Agent Activity + Chat side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agent Activity (live from Supabase) */}
            {job.agentWallet && (
              <AgentActivityByWallet agentWallet={job.agentWallet} maxEntries={15} />
            )}
            {/* Live Chat with Agent */}
            <JobChat jobId={jobId} />
          </div>

          {/* Milestone Timeline */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mb-6">
            <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-6">
              Milestones
            </h2>
          {job.milestoneCount > 0 ? (
            <MilestoneTimeline
              jobId={jobId}
              milestoneCount={Number(job.milestoneCount)}
              totalBudgetWei={job.totalBudgetWei}
            />
          ) : (
            <p className="text-white/30 text-[13px] text-center py-6">No milestones defined yet.</p>
          )}
        </div>
        </>
      )}

      {/* ── CANCELLED ── */}
      {job.status === JOB_STATUS.CANCELLED && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 mb-6">
          <p className="text-red-400 text-[14px]">This job has been cancelled.</p>
        </div>
      )}

      {/* Job details */}
      <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mb-6">
        <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-3">
          Job Details
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-white/40 text-[13px]">Data CID</span>
            <span className="text-white/60 text-[12px] font-mono">
              {job.jobDataCID ? `${job.jobDataCID.slice(0, 20)}...${job.jobDataCID.slice(-8)}` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40 text-[13px]">Skill ID</span>
            <span className="text-white/60 text-[12px] font-mono">
              {job.skillId === "0x0000000000000000000000000000000000000000000000000000000000000000"
                ? "None"
                : `${job.skillId?.slice(0, 10)}...`}
            </span>
          </div>
        </div>
      </div>

      {/* Activity log */}
      <SystemMessageLog jobId={jobId} maxEntries={15} />
    </div>
  );
}

// ─── Page wrapper with Suspense ───────────────────────────────────────────────
export default function JobDetailPage({ params }: { params: { id: string } }) {
  const jobId = parseInt(params.id);

  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-6 bg-[#050810] min-h-screen">
        <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 animate-pulse">
          <div className="h-6 bg-white/10 rounded-lg mb-4 w-48" />
          <div className="h-4 bg-white/10 rounded-lg mb-2 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 mt-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-white/10 rounded-xl" />)}
          </div>
        </div>
      </div>
    }>
      <JobDetailInner jobId={jobId} />
    </Suspense>
  );
}
