"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWalletClient, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { useAllAgents } from "@/hooks/useAllAgents";
import { useCreateSubscription } from "@/hooks/useSubscriptionEscrow";
import FuturisticSelect from "@/components/ui/FuturisticSelect";

const INTERVAL_PRESETS = [
  { label: "5 min", seconds: 300 },
  { label: "15 min", seconds: 900 },
  { label: "1 hour", seconds: 3600 },
  { label: "6 hours", seconds: 21600 },
  { label: "Daily", seconds: 86400 },
  { label: "Custom", seconds: 0 },
];

const GRACE_PRESETS = [
  { label: "1 hour", seconds: 3600 },
  { label: "6 hours", seconds: 21600 },
  { label: "24 hours", seconds: 86400 },
  { label: "7 days", seconds: 604800 },
];

function labelForInterval(seconds: number): string {
  if (seconds === 0) return "Agent proposes";
  const preset = INTERVAL_PRESETS.find((p) => p.seconds === seconds);
  if (preset && preset.label !== "Custom") return preset.label;
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 3600)} hours`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}

export default function CreateSubscriptionPage() {
  const router = useRouter();

  const { data: walletClient } = useWalletClient();
  const walletAddress = walletClient?.account.address;

  const { createSubscription, txHash, isSuccess: txSent } = useCreateSubscription();
  const { agents, isLoading: agentsLoading } = useAllAgents(true);
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (txConfirmed) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      setIsSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    }
  }, [txConfirmed, queryClient, router]);

  const [taskDescription, setTaskDescription] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [checkInRateOG, setCheckInRateOG] = useState("");
  const [alertRateOG, setAlertRateOG] = useState("");
  const [budgetOG, setBudgetOG] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [x402Enabled, setX402Enabled] = useState(false);
  const [x402Mode, setX402Mode] = useState<0 | 1>(0);
  const [intervalPreset, setIntervalPreset] = useState<number>(3600);
  const [customInterval, setCustomInterval] = useState("");
  const [gracePeriodPreset, setGracePeriodPreset] = useState<number>(86400);

  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveInterval = intervalPreset === 0 ? parseInt(customInterval) || 0 : intervalPreset;

  const handleCreate = async () => {
    if (!taskDescription || !checkInRateOG || !budgetOG || !selectedAgentId) return;
    setIsPending(true);
    setError(null);
    setIsSuccess(false);

    try {
      await createSubscription(BigInt(selectedAgentId),
        taskDescription,
        BigInt(effectiveInterval),
        parseEther(checkInRateOG),
        parseEther(alertRateOG || "0"),
        BigInt(gracePeriodPreset),
        x402Enabled,
        x402Mode,
        "0x00",
        webhookUrl,
        parseEther(budgetOG)
      );
    } catch (err: any) {
      setError(err?.message || "Transaction failed");
      setIsPending(false);
    }
  };

  const canSubmit = taskDescription && checkInRateOG && budgetOG && selectedAgentId && !isPending;

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] mb-6 transition-colors"
      >
        ← Back to Dashboard
      </Link>

      <div className="mb-6">
        <h2
          className="text-2xl font-medium mb-2"
          style={{
            background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Post a Subscription Request
        </h2>
        <p className="text-white/40 text-[14px]">
          Describe your recurring task. Agents will propose and compete for your subscription.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 space-y-5"
      >
        <div>
          <label className="block text-[13px] text-white/50 mb-2">Task Description</label>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Describe what you want the agent to monitor or do..."
            rows={3}
            className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
          />
        </div>

        <div>
          <label className="block text-[13px] text-white/50 mb-2">Select Agent</label>
          {agentsLoading ? (
            <div className="bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-white/40 text-[14px]">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-white/40 text-[14px]">
              No active agents available
            </div>
          ) : (
            <FuturisticSelect
              options={[
                { value: "", label: "Choose an agent..." },
                ...agents
                  .filter((a) => a.isActive)
                  .map((a) => ({
                    value: a.agentId.toString(),
                    label: `${a.name} — ${a.rateDisplay} OG/run`,
                  })),
              ]}
              value={selectedAgentId}
              onChange={setSelectedAgentId}
              placeholder="Choose an agent..."
              width="w-full"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                </svg>
              }
            />
          )}
          {!selectedAgentId && (
            <p className="text-[12px] text-white/30 mt-2">Select an agent to hire for this subscription</p>
          )}
        </div>

        <div>
          <label className="block text-[13px] text-white/50 mb-2">Check-in Interval</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {INTERVAL_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setIntervalPreset(preset.seconds)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                  intervalPreset === preset.seconds
                    ? "border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]"
                    : "border-white/10 text-white/40 hover:border-white/20"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {intervalPreset === 0 && (
            <input
              type="number"
              value={customInterval}
              onChange={(e) => setCustomInterval(e.target.value)}
              placeholder="Interval in seconds"
              className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30 mt-2"
            />
          )}
          <p className="text-[12px] text-white/30 mt-2">
            {effectiveInterval === 0 ? "Agent will propose an interval after approval" : `Agent will check in ${labelForInterval(effectiveInterval)}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] text-white/50 mb-2">Check-in Rate (OG)</label>
            <input
              type="number"
              step="0.001"
              value={checkInRateOG}
              onChange={(e) => setCheckInRateOG(e.target.value)}
              placeholder="0.01"
              className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label className="block text-[13px] text-white/50 mb-2">Alert Rate (OG)</label>
            <input
              type="number"
              step="0.001"
              value={alertRateOG}
              onChange={(e) => setAlertRateOG(e.target.value)}
              placeholder="0.05"
              className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] text-white/50 mb-2">Initial Budget (OG)</label>
          <input
            type="number"
            step="0.01"
            value={budgetOG}
            onChange={(e) => setBudgetOG(e.target.value)}
            placeholder="1.0"
            className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>

        <div>
          <label className="block text-[13px] text-white/50 mb-2">Grace Period</label>
          <div className="flex flex-wrap gap-2">
            {GRACE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setGracePeriodPreset(preset.seconds)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                  gracePeriodPreset === preset.seconds
                    ? "border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]"
                    : "border-white/10 text-white/40 hover:border-white/20"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[13px] text-white/50 mb-2">Webhook URL (optional)</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="rounded-xl bg-[#050810]/60 border border-white/10 p-4">
          <p className="text-[12px] text-white/40 uppercase tracking-wide mb-3">Summary</p>
          <div className="space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-white/50">Interval</span>
              <span className="text-white">{labelForInterval(effectiveInterval)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Check-in rate</span>
              <span className="text-white">{checkInRateOG || "—"} OG / run</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Alert rate</span>
              <span className="text-white">{alertRateOG || "—"} OG / alert</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Initial budget</span>
              <span className="text-white">{budgetOG || "—"} OG</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5">
              <span className="text-white/50">x402 Protocol</span>
              <span className={x402Enabled ? "text-[#38bdf8]" : "text-white/40"}>
                {x402Enabled ? `Enabled (${x402Mode === 0 ? "Agent-Side" : "On-Chain"})` : "Disabled"}
              </span>
            </div>
            {budgetOG && checkInRateOG && parseFloat(checkInRateOG) > 0 && (
              <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5">
                <span className="text-white/40">Est. runs on initial budget</span>
                <span className="text-white/60">~{Math.floor(parseFloat(budgetOG) / parseFloat(checkInRateOG))} runs</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-[#050810]/40">
          <button
            onClick={() => setX402Enabled(!x402Enabled)}
            className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${x402Enabled ? "bg-[#38bdf8]" : "bg-white/20"}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${x402Enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <div className="flex-1">
            <p className="text-white text-[13px]">Enable x402 Protocol</p>
            <p className="text-white/40 text-[11px]">Allow agent to make paid API calls charged to this subscription</p>
          </div>
        </div>

        {x402Enabled && (
          <div className="space-y-2 p-3 rounded-xl bg-[#38bdf8]/5 border border-[#38bdf8]/20">
            <p className="text-[12px] text-white/50">Verification Mode:</p>
            <div className="flex gap-2">
              {[{ value: 0, label: "Agent-Side" }, { value: 1, label: "On-Chain" }].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setX402Mode(opt.value as 0 | 1)}
                  className={`flex-1 px-3 py-2 rounded-xl border text-[12px] transition-all ${
                    x402Mode === opt.value ? "border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]" : "border-white/10 text-white/40 hover:border-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex gap-2.5">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-[13px]">{error}</p>
          </div>
        )}

        {isSuccess && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <p className="text-emerald-400 text-[13px]">Subscription created! Redirecting...</p>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={!canSubmit}
          className="w-full px-6 py-3 bg-white text-black text-[14px] font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
        >
          {isPending ? "Creating..." : "Create Subscription"}
        </button>
      </motion.div>
    </div>
  );
}

