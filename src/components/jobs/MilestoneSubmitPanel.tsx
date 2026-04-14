"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useReleaseMilestone } from "@/hooks/useProgressiveEscrow";
import { parseContractError } from "@/lib/utils";
import { type Address } from "viem";

interface MilestoneSubmitPanelProps {
  jobId: number;
  agentWallet?: Address;
  milestoneIndex: number;
  milestoneDescription: string;
  onSubmitted?: () => void;
}

export default function MilestoneSubmitPanel({
  jobId,
  agentWallet,
  milestoneIndex,
  milestoneDescription,
  onSubmitted,
}: MilestoneSubmitPanelProps) {
  const { address } = useAccount();
  const { releaseMilestone, isPending, isConfirming, isConfirmed, error } = useReleaseMilestone();

  const [outputCID, setOutputCID] = useState("");

  const isAgent = address?.toLowerCase() === agentWallet?.toLowerCase();

  if (!isAgent || isConfirmed) return null;

  const handleSubmit = async () => {
    if (!outputCID) return;

    const mockAlignmentScore = BigInt(8500);
    const mockSignature = "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    try {
      await releaseMilestone({
        jobId: BigInt(jobId),
        milestoneIndex,
        outputCID,
        alignmentScore: mockAlignmentScore,
        signature: mockSignature as `0x${string}`,
      });

      if (onSubmitted) {
        setTimeout(onSubmitted, 2000);
      }
    } catch (err) {
      console.error("Failed to release milestone:", err);
    }
  };

  if (isConfirmed) {
    return (
      <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-emerald-400 text-[13px] font-medium">Milestone Submitted!</p>
            <p className="text-white/40 text-[12px]">Waiting for alignment verification...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-[#050810]/60 border border-white/10 rounded-xl">
      <h4 className="text-[13px] font-medium text-white/60 uppercase tracking-wider mb-3">
        Submit Milestone Work
      </h4>

      <div className="mb-3">
        <label className="block text-white/40 text-[12px] mb-2">
          Output CID (0G Storage)
        </label>
        <input
          type="text"
          value={outputCID}
          onChange={(e) => setOutputCID(e.target.value)}
          placeholder="Qm... (CID of your work output)"
          className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-white/30 focus:outline-none focus:border-white/30 font-mono"
        />
        <p className="text-white/30 text-[11px] mt-1.5">
          For demo: mock alignment score (85%) will be used. In production, alignment score comes from 0G Alignment Node.
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-[12px] mb-3">{parseContractError(error)}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending || isConfirming || !outputCID}
        className="w-full px-4 py-2.5 bg-white text-black text-[13px] font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? "Confirm in wallet..." : isConfirming ? "Submitting..." : "Submit Milestone Work"}
      </button>
    </div>
  );
}
