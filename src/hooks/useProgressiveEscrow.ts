"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { useState, useMemo } from "react";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import { Address } from "viem";

export interface JobData {
  jobId: bigint;
  client: Address;
  agentId: bigint;
  status: number;
  totalBudgetWei: bigint;
  releasedWei: bigint;
  milestoneCount: number;
  agentWallet?: Address;
  jobDataCID?: string;
  skillId?: string;
}

export interface ProposalData {
  id: number;
  agentId: bigint;
  jobId: bigint;
  status: number;
  message: string;
  accepted: boolean;
  agentOwner: Address;
  proposedRateWei: bigint;
  descriptionCID: string;
  submittedAt: bigint;
}

export function useJobDetails(jobId: number) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ProgressiveEscrow.address,
    abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
    functionName: "getJob",
    args: [BigInt(jobId)],
    query: {
      enabled: jobId > 0,
    },
  });

  const jobData = useMemo<JobData | null>(() => {
    if (!data) return null;
    return {
      jobId: (data as any).jobId,
      client: (data as any).client,
      agentId: (data as any).agentId,
      status: (data as any).status,
      totalBudgetWei: (data as any).totalBudgetWei,
      releasedWei: (data as any).releasedWei,
      milestoneCount: (data as any).milestones?.length ?? 0,
      agentWallet: (data as any).agentWallet,
      jobDataCID: (data as any).jobDataCID,
      skillId: (data as any).skillId,
    };
  }, [data]);

  return {
    data: jobData,
    isLoading,
    isError: isError || false,
    refetch,
  };
}

export function useJobProposals(jobId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ProgressiveEscrow.address,
    abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
    functionName: "getProposals",
    args: [BigInt(jobId)],
    query: {
      enabled: jobId > 0,
    },
  });

  const proposals = useMemo<ProposalData[]>(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((p: any, index: number) => ({
      id: index,
      agentId: p.agentId,
      jobId: BigInt(jobId),
      status: 0,
      message: "",
      accepted: p.accepted,
      agentOwner: p.agentOwner,
      proposedRateWei: p.proposedRateWei,
      descriptionCID: p.descriptionCID,
      submittedAt: p.submittedAt,
    }));
  }, [data, jobId]);

  return {
    proposals,
    isLoading,
    refetch,
  };
}

export function useSubmitProposal() {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { data: txHash, isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: undefined as any,
  });

  const submitProposal = async (params: {
    jobId: bigint;
    agentId: bigint;
    proposedRateWei: bigint;
    descriptionCID: string;
  }) => {
    setIsPending(true);
    setIsConfirming(false);
    setIsConfirmed(false);
    setError(null);

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "submitProposal",
        args: [params.jobId, params.agentId, params.proposedRateWei, params.descriptionCID],
      });
      setIsConfirming(true);
      setIsPending(false);
      return hash;
    } catch (err) {
      setError(err as Error);
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  return {
    submitProposal,
    isPending: isPending || isWritePending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useAcceptProposal() {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const acceptProposal = async (params: { jobId: bigint; proposalIndex: bigint; value?: bigint }) => {
    setIsPending(true);
    setIsConfirming(false);
    setIsConfirmed(false);
    setError(null);

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "acceptProposal",
        args: [params.jobId, params.proposalIndex],
        value: params.value,
      });
      setIsConfirming(true);
      setIsPending(false);
      return hash;
    } catch (err) {
      setError(err as Error);
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  return {
    acceptProposal,
    isPending: isPending || isWritePending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useDefineMilestones() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [isSuccess, setIsSuccess] = useState(false);

  const defineMilestones = async (params: {
    jobId: bigint;
    percentages: number[];
    criteriaHashes: `0x${string}`[];
  }) => {
    setIsSuccess(false);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "defineMilestones",
        args: [params.jobId, params.percentages, params.criteriaHashes],
      });
      setIsSuccess(true);
      return hash;
    } catch (err) {
      setIsSuccess(false);
      throw err;
    }
  };

  return {
    defineMilestones,
    isPending,
    isSuccess,
  };
}

export function useReleaseMilestone() {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const releaseMilestone = async (params: {
    jobId: bigint;
    milestoneIndex: number;
    outputCID: string;
    alignmentScore: bigint;
    signature: `0x${string}`;
  }) => {
    setIsPending(true);
    setIsConfirming(false);
    setIsConfirmed(false);
    setError(null);

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "releaseMilestone",
        args: [
          params.jobId,
          BigInt(params.milestoneIndex),
          params.outputCID,
          params.alignmentScore,
          params.signature,
        ],
      });
      setIsConfirming(true);
      setIsPending(false);
      return hash;
    } catch (err) {
      setError(err as Error);
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  return {
    releaseMilestone,
    isPending: isPending || isWritePending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useOpenJobs() {
  const { data: openJobIds, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ProgressiveEscrow.address,
    abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
    functionName: "getOpenJobs",
    query: {},
  });

  const jobs = useMemo(() => {
    if (!openJobIds || !Array.isArray(openJobIds)) return [];
    return openJobIds.map((id: bigint) => ({ jobId: id }));
  }, [openJobIds]);

  return {
    openJobIds: (openJobIds as bigint[] | undefined)?.map(Number) ?? [],
    jobs,
    isLoading,
    refetch,
  };
}

export function useClientJobs(address?: Address | null) {
  const { address: accountAddress } = useAccount();
  const effectiveAddress = address ?? accountAddress;

  const { data: clientJobIds, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ProgressiveEscrow.address,
    abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
    functionName: "getClientJobs",
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!effectiveAddress,
    },
  });

  return {
    data: clientJobIds as bigint[] | undefined,
    isLoading,
    refetch,
  };
}

export function useProgressiveEscrow() {
  const { writeContractAsync } = useWriteContract();

  const createJob = async (params: {
    client: Address;
    agentId: bigint;
    budget: bigint;
    milestones: Array<{ description: string; percentage: number; amount: bigint }>;
  }) => {
    console.log("Creating job:", params);
  };

  const submitMilestone = async (params: {
    jobId: bigint;
    milestoneIndex: number;
    output: string;
    alignmentSignature: string;
  }) => {
    console.log("Submitting milestone:", params);
  };

  const releaseMilestone = async (params: {
    jobId: bigint;
    milestoneIndex: number;
  }) => {
    console.log("Releasing milestone:", params);
  };

  return { createJob, submitMilestone, releaseMilestone };
}

export function usePostJob() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const postJob = async (cid: string, skillBytes32: `0x${string}`) => {
    setIsConfirming(false);
    setIsConfirmed(false);
    setError(null);

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "postJob",
        args: [cid, skillBytes32],
      });
      setTxHash(hash);
      setIsConfirming(true);
      return hash;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return { postJob, isPending, isConfirming, isConfirmed, txHash, error };
}