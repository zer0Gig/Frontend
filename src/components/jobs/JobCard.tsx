"use client";

import { useJobDetails, type JobData } from "@/hooks/useProgressiveEscrow";
import { useAgentProfile } from "@/hooks/useAgentProfile";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatOG } from "@/lib/utils";
import { MOCK_JOBS } from "@/lib/mockData";

interface JobCardProps {
  jobId: number;
  index: number;
}

export default function JobCard({ jobId, index }: JobCardProps) {
  const { data: jobRaw, isLoading, isError } = useJobDetails(jobId);
  const agentIdNum = (jobRaw as any)?.agentId ? Number((jobRaw as any).agentId) : 0;
  const { profile } = useAgentProfile(agentIdNum > 0 ? agentIdNum : undefined);
  const displayName = profile?.display_name || "";
  
  // DEMO MODE: Fall back to mock data when real job doesn't exist on-chain
  const mockJob = MOCK_JOBS.find(j => j.jobId === jobId.toString());
  const job = (jobRaw as unknown as JobData) || (mockJob ? {
    jobId: BigInt(mockJob.jobId),
    client: mockJob.client,
    agentId: BigInt(mockJob.agentId),
    agentWallet: "0x0000000000000000000000000000000000000000",
    jobDataCID: mockJob.jobDataCID,
    skillId: mockJob.skillId,
    totalBudgetWei: mockJob.totalBudgetWei,
    releasedWei: mockJob.releasedWei,
    milestoneCount: BigInt(mockJob.milestoneCount),
    status: mockJob.status,
  } as unknown as JobData : undefined);

  if (isLoading) {
    return (
      <div className="h-14 bg-white/5 rounded-xl animate-pulse" />
    );
  }

  if (isError || !job) {
    return null;
  }

  const getStatusBadge = (status: number) => {
    const statusMap = {
      0: { bg: "bg-white/10", text: "text-white/60", label: "Pending Setup" },
      1: { bg: "bg-[#38bdf8]/10", text: "text-[#38bdf8]", label: "In Progress" },
      2: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Completed" },
      3: { bg: "bg-red-500/10", text: "text-red-400", label: "Cancelled" },
      4: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Partial" },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap[0];
  };

  const status = getStatusBadge(job.status);

  return (
    <Link href={`/dashboard/jobs/${jobId}`}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#0d1525]/90 px-4 py-3.5 hover:border-white/20 transition-colors cursor-pointer"
      >
        {/* Status badge */}
        <span className={`px-2.5 py-1 rounded-full text-[12px] ${status.bg} ${status.text}`}>
          {status.label}
        </span>

        {/* Job ID + agent */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[14px] font-medium">Job #{job.jobId.toString()}</p>
          <p className="text-white/40 text-[12px]">
            {displayName || (job.agentId > 0n ? `Agent #${job.agentId.toString()}` : "Unassigned")}
          </p>
        </div>

        {/* Budget */}
        <div className="text-right flex-shrink-0">
          <p className="text-white text-[13px]">{formatOG(job.totalBudgetWei)} OG</p>
          <p className="text-white/40 text-[11px]">{formatOG(job.releasedWei)} released</p>
        </div>

        {/* Progress bar */}
        <div className="w-20 flex-shrink-0">
          <div className="h-1 bg-[#0d1525]/90 border border-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#38bdf8] to-[#22d3ee] rounded-full"
              style={{
                width: `${Math.min(100, Number(job.releasedWei * 100n / (job.totalBudgetWei || 1n)))}%`
              }}
            />
          </div>
        </div>

        {/* Arrow */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white/30 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L11.586 9H5a1 1 0 110-2h6.586l-4.293-4.293a1 1 0 011.414-1.414l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </motion.div>
    </Link>
  );
}