"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscriptionEscrow";
import { formatOG } from "@/lib/utils";
import { MOCK_SUBSCRIPTIONS } from "@/lib/mockData";

interface SubscriptionCardProps {
  subscriptionId: number;
  index: number;
}

function intervalModeLabel(mode: number): string {
  return ["Client-Set", "Agent-Proposed", "Agent-Auto"][mode] ?? "Unknown";
}

function SubscriptionStatusBadge({ status }: { status: number }) {
  const styles: Record<number, string> = {
    0: "px-2.5 py-1 rounded-full bg-white/10 text-white/60 text-[12px]",
    1: "px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[12px]",
    2: "px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-[12px]",
    3: "px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[12px]",
  };
  const labels: Record<number, string> = {
    0: "Pending",
    1: "Active",
    2: "Paused",
    3: "Cancelled",
  };

  return (
    <span className={styles[status] ?? styles[0]}>
      {labels[status] ?? "Unknown"}
    </span>
  );
}

export default function SubscriptionCard({ subscriptionId, index }: SubscriptionCardProps) {
  const { data: sub, isLoading, isError } = useSubscription(subscriptionId);

  // DEMO MODE: Fall back to mock data when real subscription doesn't exist on-chain
  const mockSub = MOCK_SUBSCRIPTIONS.find(s => s.subscriptionId === subscriptionId);
  const displayData = sub || (mockSub ? [
    BigInt(mockSub.subscriptionId),   // 0: subscriptionId
    BigInt(0),                        // 1: (unused)
    BigInt(mockSub.agentId),          // 2: agentId
    mockSub.client,                   // 3: agentWallet
    mockSub.taskDescription,          // 4: taskDescription
    mockSub.intervalSeconds,          // 5: intervalSeconds
    mockSub.intervalMode,             // 6: intervalMode
    mockSub.checkInRate,              // 7: checkInRate
    mockSub.alertRate,                // 8: alertRate
    mockSub.balance,                  // 9: balance
    mockSub.totalDrained,             // 10: totalDrained
    mockSub.status,                   // 11: status
    mockSub.lastCheckIn,              // 12: lastCheckIn
    BigInt(0),                        // 13: (unused)
    mockSub.gracePeriodEnds,          // 14: gracePeriodEnds
    mockSub.gracePeriodSeconds,       // 15: gracePeriodSeconds
    mockSub.proposedInterval,         // 16: proposedInterval
    mockSub.x402Enabled,              // 17: x402Enabled
    mockSub.x402VerificationMode,     // 18: x402VerificationMode
    BigInt(0),                        // 19: (unused)
    mockSub.webhookUrl,               // 20: webhookUrl
  ] as unknown[] : undefined);

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#0d1525]/90 px-4 py-3.5">
        <div className="w-16 h-5 bg-white/5 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="w-3/4 h-4 bg-white/5 rounded animate-pulse" />
          <div className="w-1/2 h-3 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="w-16 h-4 bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  if (isError || !displayData) {
    return null;
  }

  // Destructure tuple by index (matching contract getSubscription return)
  const subData = displayData as unknown[];
  const taskDescription = (subData[4] as string) || "Unknown Task";
  const intervalMode = Number(subData[6] || 0);
  const balance = (subData[9] as bigint) || BigInt(0);
  const status = Number(subData[11] || 0);
  const agentId = (subData[2] as bigint) || BigInt(0);

  return (
    <Link href={`/dashboard/subscriptions/${subscriptionId}`}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#0d1525]/90 px-4 py-3.5 hover:border-white/20 transition-colors cursor-pointer"
      >
        {/* Status badge */}
        <SubscriptionStatusBadge status={status} />

        {/* Description + agent */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[14px] font-medium truncate">
            {taskDescription.length > 40
              ? taskDescription.slice(0, 40) + "..."
              : taskDescription}
          </p>
          <p className="text-white/40 text-[12px]">
            Agent #{agentId.toString()} · {intervalModeLabel(intervalMode)}
          </p>
        </div>

        {/* Balance */}
        <div className="text-right flex-shrink-0">
          <p className="text-white text-[13px]">{formatOG(balance)} OG</p>
          <p className="text-white/40 text-[11px]">balance</p>
        </div>

        {/* Arrow */}
        <svg
          className="text-white/30 flex-shrink-0"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </motion.div>
    </Link>
  );
}

export { SubscriptionStatusBadge };
