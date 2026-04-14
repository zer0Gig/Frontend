"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { parseEther } from "viem";
import { useWaitForTransactionReceipt, useReadContract } from "wagmi";
import {
  useSubscription,
  useTopUp,
  useCancelSubscription,
  useApproveInterval,
  useSetWebhookUrl,
  useFinalizeExpired,
} from "@/hooks/useSubscriptionEscrow";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import { SubscriptionStatusBadge } from "@/components/subscriptions/SubscriptionCard";
import GracePeriodBanner from "@/components/subscriptions/GracePeriodBanner";
import DrainHistory from "@/components/subscriptions/DrainHistory";
import ClientTelegramBotSection from "@/components/subscriptions/ClientTelegramBotSection";
import { formatOG } from "@/lib/utils";

function intervalModeLabel(mode: number): string {
  return ["Client-Set", "Agent-Proposed", "Agent-Auto"][mode] ?? "Unknown";
}

function formatInterval(seconds: bigint): string {
  const s = Number(seconds);
  if (s < 60) return `${s} seconds`;
  if (s < 3600) return `${Math.floor(s / 60)} minutes`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours`;
  return `${Math.floor(s / 86400)} days`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.2)" }}
      transition={{ duration: 0.15 }}
      className="rounded-xl bg-[#050810]/60 border border-white/10 px-4 py-3 cursor-default"
    >
      <p className="text-[11px] text-white/40 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white text-[15px] font-medium">{value}</p>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-white/5">
      <span className="text-white/40">{label}</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}

export default function SubscriptionDetailPage() {
  const params = useParams();
  const subId = BigInt(params?.id as string);

  const { data: sub, isLoading, isError, refetch } = useSubscription(subId);

  // Hook instances
  const { topUp, isPending: topUpPending, data: topUpHash } = useTopUp();
  const { cancelSubscription, isPending: cancelPending, data: cancelHash } = useCancelSubscription();
  const { approveInterval, isPending: approveIntervalPending, data: approveHash } = useApproveInterval();
  const { setWebhookUrl, isPending: setWebhookPending, data: webhookHash } = useSetWebhookUrl();
  const { finalizeExpired, isPending: finalizePending, data: finalizeHash } = useFinalizeExpired();

  // Wait for transaction confirmations
  const { isSuccess: topUpConfirmed } = useWaitForTransactionReceipt({ hash: topUpHash });
  const { isSuccess: cancelConfirmed } = useWaitForTransactionReceipt({ hash: cancelHash });
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: webhookConfirmed } = useWaitForTransactionReceipt({ hash: webhookHash });
  const { isSuccess: finalizeConfirmed } = useWaitForTransactionReceipt({ hash: finalizeHash });

  // Local state
  const [topUpAmount, setTopUpAmount] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Refetch on any confirmation (moved to useEffect to prevent infinite loop)
  useEffect(() => {
    if (topUpConfirmed || cancelConfirmed || approveConfirmed || webhookConfirmed || finalizeConfirmed) {
      refetch();
    }
  }, [topUpConfirmed, cancelConfirmed, approveConfirmed, webhookConfirmed, finalizeConfirmed, refetch]);

  // Fetch agent profile for capabilities display
  const subAgentId = (sub as any)?.agentId;
  const { data: agentProfile } = useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: "getAgentProfile",
    args: [subAgentId ? BigInt(subAgentId.toString()) : 0n],
    query: { enabled: subAgentId && Number(subAgentId) > 0 },
  });

  const agentCapabilities = useMemo(() => {
    if (!agentProfile) return [];
    try {
      const cid = (agentProfile as any).capabilityCID;
      if (!cid) return [];
      let base64 = cid;
      if (cid.includes(":")) base64 = cid.split(":")[1];
      const decoded = JSON.parse(atob(base64));
      return decoded.skills || [];
    } catch {
      return [];
    }
  }, [agentProfile]);

  // Handlers
  const handleTopUp = (amount: bigint) => {
    topUp(subId, amount);
  };

  const handleTopUpInline = () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) return;
    topUp(subId, parseEther(topUpAmount));
    setTopUpAmount("");
  };

  const handleApproveInterval = () => {
    approveInterval(subId);
  };

  const handleCancel = () => {
    cancelSubscription(subId);
    setShowCancelConfirm(false);
  };

  const handleFinalize = () => {
    finalizeExpired(subId);
  };

  const handleSetWebhook = () => {
    if (!newWebhookUrl) return;
    setWebhookUrl(subId, newWebhookUrl);
    setNewWebhookUrl("");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6">
          <div className="w-32 h-4 bg-white/5 rounded animate-pulse mb-4" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6">
          <div className="space-y-4">
            <div className="w-48 h-6 bg-white/5 rounded animate-pulse" />
            <div className="w-full h-20 bg-white/5 rounded animate-pulse" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !sub) {
    return (
      <div className="max-w-3xl">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] mb-6 transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-8 text-center">
          <p className="text-red-400/70 text-[14px]">Failed to load subscription.</p>
        </div>
      </div>
    );
  }

  // Viem returns structs as named objects, not numeric arrays
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subData = sub as any;
  const agentId            = subData.agentId            as bigint;
  const agentWallet        = subData.agentWallet        as string;
  const taskDescription    = subData.taskDescription    as string;
  const intervalSeconds    = subData.intervalSeconds    as bigint;
  const intervalMode       = Number(subData.intervalMode);
  const checkInRate        = subData.checkInRate        as bigint;
  const alertRate          = subData.alertRate          as bigint;
  const balance            = subData.balance            as bigint;
  const totalDrained       = subData.totalDrained       as bigint;
  const status             = Number(subData.status);
  const lastCheckIn        = subData.lastCheckIn        as bigint;
  const gracePeriodEnds    = subData.gracePeriodEnds    as bigint;
  const gracePeriodSeconds = subData.gracePeriodSeconds as bigint;
  const proposedInterval   = subData.proposedInterval   as bigint;
  const x402Enabled        = subData.x402Enabled        as boolean;
  const x402VerificationMode = Number(subData.x402VerificationMode);
  const webhookUrlValue    = subData.webhookUrl         as string;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl"
    >
      {/* A. Back navigation */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] mb-6 transition-colors"
      >
        ← Back to Dashboard
      </Link>

      {/* B. Header card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mb-6"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-medium text-white">Subscription #{params?.id}</h1>
              <SubscriptionStatusBadge status={status} />
            </div>
            <p className="text-white/50 text-[14px] leading-relaxed">{taskDescription}</p>
            <p className="text-white/30 text-[12px] mt-1">
              Agent #{agentId.toString()} · {intervalModeLabel(intervalMode)}
            </p>
            {agentCapabilities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {agentCapabilities.map((cap: string) => (
                  <span
                    key={cap}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#38bdf8]/10 border border-[#38bdf8]/15 text-[#38bdf8]/70 text-[11px]"
                  >
                    {cap.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4-column stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Current Balance" value={`${formatOG(balance)} OG`} />
          <StatCard label="Total Drained" value={`${formatOG(totalDrained)} OG`} />
          <StatCard label="Check-in Rate" value={`${formatOG(checkInRate)} OG/run`} />
          <StatCard label="Alert Rate" value={`${formatOG(alertRate)} OG/alert`} />
        </div>
      </motion.div>

      {/* C. Grace period banner (conditional) */}
      {status === 2 && (
        <GracePeriodBanner
          subscriptionId={subId}
          gracePeriodEnds={gracePeriodEnds}
          onTopUp={handleTopUp}
          onFinalize={handleFinalize}
          isTopUpPending={topUpPending}
          isFinalizePending={finalizePending}
        />
      )}

      {/* D. Mode B approval section (conditional) */}
      {intervalMode === 1 && status === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mb-6"
        >
          <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-3">
            Interval Approval
          </h2>
          {proposedInterval === 0n ? (
            <p className="text-white/40 text-[13px]">
              Waiting for agent to propose a check-in interval...
            </p>
          ) : (
            <div>
              <p className="text-white/70 text-[14px] mb-4">
                Agent proposed:{" "}
                <span className="text-white font-medium">{formatInterval(proposedInterval)}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleApproveInterval}
                  disabled={approveIntervalPending}
                  className="px-6 py-2.5 bg-white text-black text-[14px] font-medium rounded-full disabled:opacity-50"
                >
                  {approveIntervalPending ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-6 py-2.5 bg-[#0d1525]/90 border border-red-500/30 text-red-400 text-[14px] font-medium rounded-full hover:bg-red-500/10 transition-colors"
                >
                  Reject & Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* E. Actions panel */}
      {status !== 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mb-6"
        >
          <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-4">
            Actions
          </h2>
          <div className="space-y-4">
            {/* Add Funds */}
            <div>
              <p className="text-[13px] text-white/50 mb-2">Add Funds</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Amount in OG"
                  className="flex-1 bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={handleTopUpInline}
                  disabled={topUpPending || !topUpAmount}
                  className="px-5 py-2.5 bg-white text-black text-[13px] font-medium rounded-full disabled:opacity-50"
                >
                  {topUpPending ? "Adding..." : "Add Funds"}
                </button>
              </div>
            </div>

            {/* Update Webhook */}
            <div>
              <p className="text-[13px] text-white/50 mb-2">Webhook URL</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder={webhookUrlValue || "https://your-server.com/webhook"}
                  className="flex-1 bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={handleSetWebhook}
                  disabled={setWebhookPending || !newWebhookUrl}
                  className="px-5 py-2.5 bg-[#0d1525]/90 border border-white/20 text-white text-[13px] font-medium rounded-full disabled:opacity-50 hover:border-white/30 transition-colors"
                >
                  {setWebhookPending ? "Updating..." : "Update"}
                </button>
              </div>
            </div>

            {/* Cancel */}
            <div className="pt-2 border-t border-white/10">
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-red-400/70 text-[13px] hover:text-red-400 transition-colors"
                >
                  Cancel Subscription
                </button>
              ) : (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                  <p className="text-red-400/80 text-[13px] mb-3">
                    Are you sure? This will refund remaining balance.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelPending}
                      className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-[12px] font-medium rounded-full disabled:opacity-50 hover:bg-red-500/30 transition-colors"
                    >
                      {cancelPending ? "Cancelling..." : "Yes, Cancel"}
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-4 py-2 bg-[#0d1525]/90 border border-white/20 text-white/60 text-[12px] font-medium rounded-full hover:text-white transition-colors"
                    >
                      Never mind
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* F. Customer service bot config (client-side) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <ClientTelegramBotSection subscriptionId={subId} />
      </motion.div>

      {/* G. Drain history */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <DrainHistory subscriptionId={subId} />
      </motion.div>

      {/* H. Subscription details section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mt-6"
      >
        <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-3">
          Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
          <InfoRow label="Grace Period" value={formatInterval(gracePeriodSeconds)} />
          <InfoRow
            label="Last Check-in"
            value={
              lastCheckIn > 0n
                ? new Date(Number(lastCheckIn) * 1000).toLocaleString()
                : "Never"
            }
          />
          <InfoRow label="x402 Enabled" value={x402Enabled ? "Yes" : "No"} />
          {x402Enabled && (
            <InfoRow
              label="x402 Mode"
              value={x402VerificationMode === 0 ? "Agent-Side" : "On-Chain"}
            />
          )}
          <InfoRow label="Webhook" value={webhookUrlValue || "—"} />
          <InfoRow
            label="Agent Wallet"
            value={`${agentWallet.slice(0, 6)}...${agentWallet.slice(-4)}`}
          />
          {intervalMode === 0 && (
            <InfoRow label="Interval" value={formatInterval(intervalSeconds)} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
