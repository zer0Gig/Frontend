import { useReadContract, useWriteContract } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import { Address } from "viem";

export function useSubscription(subscriptionId: bigint | number) {
  return useReadContract({
    address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
    abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
    functionName: "getSubscription",
    args: [BigInt(subscriptionId)],
  });
}

export function useClientSubscriptions(clientAddress: Address | undefined) {
  return useReadContract({
    address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
    abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
    functionName: "getClientSubscriptions",
    args: clientAddress ? [clientAddress] : undefined,
    query: { enabled: !!clientAddress },
  });
}

export function useSubscriptionBalance(subscriptionId: bigint | number) {
  return useReadContract({
    address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
    abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
    functionName: "getBalance",
    args: [BigInt(subscriptionId)],
  });
}

export function useTotalSubscriptions() {
  return useReadContract({
    address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
    abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
    functionName: "totalSubscriptions",
  });
}

export function useCreateSubscription() {
  const { writeContractAsync, isPending, isSuccess, isError, error, data: txHash } = useWriteContract();

  const createSubscription = async (
    agentId: bigint,
    taskDescription: string,
    intervalSeconds: bigint,
    checkInRate: bigint,
    alertRate: bigint,
    gracePeriodSeconds: bigint,
    x402Enabled: boolean,
    x402VerificationMode: number,
    clientX402Sig: `0x${string}`,
    webhookUrl: string,
    value: bigint
  ): Promise<`0x${string}` | undefined> => {
    const hash = await writeContractAsync({
      address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
      abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
      functionName: "createSubscription",
      args: [agentId, taskDescription, intervalSeconds, checkInRate, alertRate, gracePeriodSeconds, x402Enabled, x402VerificationMode, clientX402Sig, webhookUrl],
      value,
    });
    return hash;
  };

  return { createSubscription, isPending, isSuccess, isError, error, txHash };
}

export function useTopUp() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const topUp = (subscriptionId: bigint, value: bigint) => {
    writeContract({
      address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
      abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
      functionName: "topUp",
      args: [subscriptionId],
      value,
    });
  };

  return { topUp, isPending, isSuccess, isError, data, error };
}

export function useCancelSubscription() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const cancelSubscription = (subscriptionId: bigint) => {
    writeContract({
      address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
      abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
      functionName: "cancelSubscription",
      args: [subscriptionId],
    });
  };

  return { cancelSubscription, isPending, isSuccess, isError, data, error };
}

export function useApproveInterval() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const approveInterval = (subscriptionId: bigint) => {
    writeContract({
      address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
      abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
      functionName: "approveInterval",
      args: [subscriptionId],
    });
  };

  return { approveInterval, isPending, isSuccess, isError, data, error };
}

export function useSetWebhookUrl() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const setWebhookUrl = (subscriptionId: bigint, webhookUrl: string) => {
    writeContract({
      address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
      abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
      functionName: "setWebhookUrl",
      args: [subscriptionId, webhookUrl],
    });
  };

  return { setWebhookUrl, isPending, isSuccess, isError, data, error };
}

export function useFinalizeExpired() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const finalizeExpired = (subscriptionId: bigint) => {
    writeContract({
      address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
      abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
      functionName: "finalizeExpired",
      args: [subscriptionId],
    });
  };

  return { finalizeExpired, isPending, isSuccess, isError, data, error };
}

export function useGetStatus(subscriptionId: bigint | number) {
  return useReadContract({
    address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
    abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
    functionName: "getStatus",
    args: [BigInt(subscriptionId)],
  });
}
