"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { animate } from "animejs";
import { useAccount } from "wagmi";
import { type Address } from "viem";
import { useOwnerAgents } from "@/hooks/useAgentRegistry";
import { useOpenJobs, useJobDetails, useJobProposals, type ProposalData } from "@/hooks/useProgressiveEscrow";
import { useAgentProfiles } from "@/hooks/useAgentProfile";
import { formatOG, formatRelativeTime } from "@/lib/utils";

// ── Proposals list (scans open jobs for our proposals) ────────────────────────

function ProposalsList({ agentIds }: { agentIds: bigint[] }) {
  const { openJobIds, isLoading: jobsLoading } = useOpenJobs();
  const { profiles } = useAgentProfiles(agentIds.map(id => Number(id)));

  if (jobsLoading || !openJobIds || openJobIds.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {openJobIds.map((jobId, i) => (
        <JobProposalsRow key={jobId.toString()} jobId={jobId} agentIds={agentIds} profiles={profiles} index={i} />
      ))}
    </div>
  );
}

function JobProposalsRow({
  jobId,
  agentIds,
  profiles,
  index,
}: {
  jobId: bigint;
  agentIds: bigint[];
  profiles: Record<number, { display_name?: string | null } | undefined>;
  index: number;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const { proposals } = useJobProposals(jobId);
  const { data: jobRaw } = useJobDetails(jobId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = jobRaw as any;

  useEffect(() => {
    if (!rowRef.current) return;
    animate(rowRef.current, {
      translateY: [16, 0],
      opacity: [0, 1],
      duration: 350,
      easing: "easeOutCubic",
      delay: index * 60,
    });
  }, [index, rowRef]);

  // Filter proposals from our agents
  const myProposals = proposals?.filter((p: ProposalData) =>
    agentIds.some((aId) => aId === p.agentId)
  );

  if (!myProposals || myProposals.length === 0) return null;

  const clientShort = job?.client
    ? `${job.client.slice(0, 6)}...${job.client.slice(-4)}`
    : "—";

  return (
    <div
      ref={rowRef}
      style={{ opacity: 0 }}
      className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link
            href={`/dashboard/jobs/${jobId.toString()}`}
            className="text-white text-[15px] font-medium hover:text-[#38bdf8] transition-colors"
          >
            Job #{jobId.toString()}
          </Link>
          <p className="text-white/30 text-[12px] font-mono mt-0.5">
            Client: {clientShort}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20">
          {myProposals.length} proposal{myProposals.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {myProposals.map((p: ProposalData, pi: number) => (
          <div
            key={pi}
            className={`flex items-center justify-between py-3 px-4 rounded-xl ${
              p.accepted
                ? "bg-emerald-500/8 border border-emerald-500/15"
                : "bg-white/[0.02] border border-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${p.accepted ? "bg-emerald-400" : "bg-amber-400"}`} />
              <div>
                <p className="text-white text-[13px] font-medium">
                  {profiles[Number(p.agentId)]?.display_name || `Agent #${p.agentId.toString()}`}
                </p>
                <p className="text-white/30 text-[11px]">
                  {p.accepted ? "Accepted" : "Pending review"} · Submitted {formatRelativeTime(Number(p.submittedAt))}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-[14px] font-semibold">{formatOG(p.proposedRateWei)} OG</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inner page ────────────────────────────────────────────────────────────────

function MyProposalsInner() {
  const headerRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  const { data: agentIdsRaw } = useOwnerAgents(address as Address | undefined);
  const agentIds = agentIdsRaw as bigint[] | undefined;

  // Header entrance animation
  useEffect(() => {
    if (!headerRef.current) return;
    animate(headerRef.current, {
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 500,
      easing: "easeOutCubic",
      delay: 0,
    });
  }, []);

  if (!agentIds || agentIds.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] mb-6 transition-colors">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            ← Back to Dashboard
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-white/50 text-[15px] font-medium mb-1">No proposals yet</p>
          <p className="text-white/30 text-[13px] max-w-sm mx-auto mb-6">
            Browse open jobs and submit your first proposal to start earning.
          </p>
          <Link
            href="/dashboard/jobs"
            className="inline-flex px-5 py-2.5 bg-[#38bdf8] text-black text-[13px] font-medium rounded-full hover:bg-[#7dd3fc] transition-colors"
          >
            Find Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div ref={headerRef} style={{ opacity: 0 }} className="mb-8">
        <div className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] mb-6 transition-colors">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-medium text-white mb-2">
          My Proposals
        </h1>
        <p className="text-white/40 text-[14px]">
          Track all proposals your agents have submitted. Pending proposals wait for client review.
        </p>
      </div>

      <ProposalsList agentIds={agentIds} />
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function MyProposalsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <div className="h-8 bg-white/10 rounded-lg mb-4 animate-pulse w-40" />
          <div className="h-5 bg-white/5 rounded-lg mb-8 animate-pulse w-64" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <MyProposalsInner />
    </Suspense>
  );
}
