"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { animate } from "animejs";
import { useOpenJobs, useJobDetails, useJobProposals } from "@/hooks/useProgressiveEscrow";
import { useUserRole, UserRole } from "@/hooks/useUserRegistry";
import { useAccount } from "wagmi";
import { CONTRACT_CONFIG, SKILL_IDS } from "@/lib/contracts";
import { formatRelativeTime } from "@/lib/utils";
import { type Address } from "viem";

// ── Skill labels ──────────────────────────────────────────────────────────────

const SKILL_MAP: Record<string, string> = {
  [SKILL_IDS.solidityDev]: "Solidity Dev",
  [SKILL_IDS.frontendDev]: "Frontend Dev",
  [SKILL_IDS.webSearch]: "Web Search",
  [SKILL_IDS.codeExecution]: "Code Execution",
  [SKILL_IDS.dataAnalysis]: "Data Analysis",
  [SKILL_IDS.contentWriting]: "Content Writing",
  [SKILL_IDS.imageGeneration]: "Image Generation",
};

const JOB_STATUS = {
  OPEN: 0,
} as const;

// ── Skill filter options ──────────────────────────────────────────────────────

const SKILL_FILTERS = [
  { value: "", label: "All Skills" },
  { value: SKILL_IDS.solidityDev, label: "Solidity Dev" },
  { value: SKILL_IDS.frontendDev, label: "Frontend Dev" },
  { value: SKILL_IDS.webSearch, label: "Web Search" },
  { value: SKILL_IDS.codeExecution, label: "Code Execution" },
  { value: SKILL_IDS.dataAnalysis, label: "Data Analysis" },
  { value: SKILL_IDS.contentWriting, label: "Content Writing" },
  { value: SKILL_IDS.imageGeneration, label: "Image Generation" },
];

// ── Single job card with anime entrance ───────────────────────────────────────

function OpenJobCard({
  jobId,
  index,
  skillFilter,
}: {
  jobId: bigint;
  index: number;
  skillFilter: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { data: jobRaw } = useJobDetails(Number(jobId));
  const { proposals } = useJobProposals(Number(jobId));

  // Anime entrance — must be before any early returns
  useEffect(() => {
    if (!cardRef.current) return;
    animate(cardRef.current, {
      translateY: [24, 0],
      opacity: [0, 1],
      duration: 400,
      easing: "easeOutCubic",
      delay: index * 60,
    });
  }, [index, cardRef]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = jobRaw as any;

  // Filter out jobs that don't match the selected skill
  if (skillFilter && job?.skillId && job.skillId !== skillFilter) {
    return null;
  }

  // Skip if not open
  if (!job || Number(job?.status) !== JOB_STATUS.OPEN) return null;

  const skillLabel = job.skillId && job.skillId !== "0x0000000000000000000000000000000000000000000000000000000000000000"
    ? SKILL_MAP[job.skillId as string] || "Custom Skill"
    : "General";

  const proposalCount = proposals?.length ?? 0;
  const clientShort = job.client ? `${job.client.slice(0, 6)}...${job.client.slice(-4)}` : "—";
  const createdAt = job.createdAt ? Number(job.createdAt) : 0;

  return (
    <div
      ref={cardRef}
      style={{ opacity: 0 }}
      className="group rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5 hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(56,189,248,0.06)]"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/dashboard/jobs/${jobId}`}
              className="text-white text-[15px] font-medium group-hover:text-[#38bdf8] transition-colors"
            >
              Job #{jobId.toString()}
            </Link>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
              Open
            </span>
          </div>
          <p className="text-white/30 text-[12px] font-mono">
            {clientShort}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-white/40 text-[11px] uppercase tracking-wide mb-0.5">Proposals</p>
          <p className="text-white text-[18px] font-semibold">{proposalCount}</p>
        </div>
      </div>

      {/* Skill badge + time */}
      <div className="flex items-center gap-3 mb-4">
        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-[11px] text-white/50">
          {skillLabel}
        </span>
        {createdAt > 0 && (
          <span className="text-white/30 text-[11px]">
            {formatRelativeTime(createdAt)}
          </span>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/dashboard/jobs/${jobId}`}
        className="inline-flex items-center gap-1.5 text-[12px] text-[#38bdf8] font-medium hover:text-[#7dd3fc] transition-colors"
      >
        View Details & Apply
        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

// ── Inner page (wrapped in Suspense for searchParams) ─────────────────────────

function OpenJobsInner() {
  const headerRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  const { role } = useUserRole(address as Address | undefined);

  const { openJobIds, jobs, isLoading, refetch } = useOpenJobs();

  const [skillFilter, setSkillFilter] = useState("");

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

  // Count visible jobs after filter
  const visibleCount = openJobIds?.length ?? 0;

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
          Find Jobs
        </h1>
        <p className="text-white/40 text-[14px]">
          Browse open jobs on-chain. Submit a proposal with your rate and approach — the client picks the best fit.
        </p>
      </div>

      {/* Skill filter bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SKILL_FILTERS.map((s) => {
          const isActive = skillFilter === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setSkillFilter(s.value)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${
                isActive
                  ? "bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/25"
                  : "bg-white/5 text-white/40 border border-white/8 hover:border-white/15 hover:text-white/60"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Job count */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !openJobIds || openJobIds.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white/50 text-[15px] font-medium mb-1">No open jobs available</p>
          <p className="text-white/30 text-[13px] max-w-sm mx-auto">
            New jobs appear here automatically when clients post them on-chain. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job, i) => (
            <OpenJobCard
              key={job.jobId.toString()}
              jobId={job.jobId}
              index={i}
              skillFilter={skillFilter}
            />
          ))}
        </div>
      )}

      {/* Refresh button */}
      {!isLoading && openJobIds && openJobIds.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-[12px] hover:text-white/70 hover:border-white/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function OpenJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <div className="h-8 bg-white/10 rounded-lg mb-4 animate-pulse w-40" />
          <div className="h-5 bg-white/5 rounded-lg mb-8 animate-pulse w-72" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <OpenJobsInner />
    </Suspense>
  );
}
