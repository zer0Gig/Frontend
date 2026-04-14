"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletClient, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { useAllAgents } from "@/hooks/useAllAgents";
import { useCreateSubscription } from "@/hooks/useSubscriptionEscrow";

const INTERVAL_PRESETS = [
  { label: "5 min", seconds: 300 },
  { label: "15 min", seconds: 900 },
  { label: "1 hour", seconds: 3600 },
  { label: "6 hours", seconds: 21600 },
  { label: "Daily", seconds: 86400 },
  { label: "Custom", seconds: 0 },
];

const GRACE_PRESETS = [
  { label: "1h", seconds: 3600 },
  { label: "6h", seconds: 21600 },
  { label: "24h", seconds: 86400 },
  { label: "7d", seconds: 604800 },
];

const CAPABILITY_FILTERS = [
  { id: "web_search",       label: "Web Search",    icon: "🔍" },
  { id: "code_execution",  label: "Code Exec",    icon: "⚡" },
  { id: "data_analysis",   label: "Data Analysis", icon: "📊" },
  { id: "content_writing", label: "Writing",       icon: "✍️" },
  { id: "image_generation",label: "Image Gen",     icon: "🎨" },
  { id: "solidity_dev",    label: "Solidity",      icon: "📜" },
  { id: "frontend_dev",    label: "Frontend",     icon: "🖥️" },
];

function labelForInterval(seconds: number): string {
  if (seconds === 0) return "Agent proposes";
  const preset = INTERVAL_PRESETS.find((p) => p.seconds === seconds);
  if (preset && preset.label !== "Custom") return preset.label;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function CapabilityBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] text-[10px] text-white/50 border border-white/[0.08]">
      {label}
    </span>
  );
}

function AgentCard({
  agent,
  isSelected,
  onClick,
}: {
  agent: { agentId: number; name: string; skills: string[]; rateDisplay: string; scoreDisplay: string; isActive: boolean };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      animate={isSelected ? {
        borderColor: "rgba(56, 189, 248, 0.5)",
        boxShadow: "0 0 20px rgba(56, 189, 248, 0.15)",
      } : {
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 0 0px rgba(56, 189, 248, 0)",
      }}
      className={`w-full text-left rounded-xl border bg-[#050810]/80 p-4 transition-all duration-200 relative overflow-hidden`}
    >
      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-[#38bdf8]/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${agent.isActive ? "bg-emerald-400/70" : "bg-white/20"}`} />
            <p className="text-[14px] font-medium text-white truncate">{agent.name}</p>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {agent.skills.slice(0, 3).map((skill) => (
              <CapabilityBadge key={skill} label={skill} />
            ))}
            {agent.skills.length > 3 && (
              <span className="text-[10px] text-white/30 self-center">+{agent.skills.length - 3}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <span className="text-[14px] font-semibold text-[#38bdf8]">{agent.rateDisplay}</span>
          <span className="text-[11px] text-white/30 mt-0.5">OG/task</span>
          <span className="text-[10px] text-white/25 mt-1">★ {agent.scoreDisplay}</span>
        </div>
      </div>
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex items-center gap-1.5 mt-3 pt-3 border-t border-[#38bdf8]/20"
          >
            <svg className="w-3.5 h-3.5 text-[#38bdf8]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-[12px] text-[#38bdf8] font-medium">Selected</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const { data: walletClient } = useWalletClient();

  const { createSubscription, txHash } = useCreateSubscription();
  const { agents, isLoading: agentsLoading } = useAllAgents(true);
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });
  const queryClient = useQueryClient();

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filteredAgents = useMemo(() => {
    const active = agents.filter((a) => a.isActive);
    if (selectedFilters.length === 0) return active;
    return active.filter((agent) =>
      selectedFilters.every((filter) =>
        agent.skillIds.some((sid) => sid.toLowerCase().includes(filter.toLowerCase()))
      )
    );
  }, [agents, selectedFilters]);

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

  const toggleFilter = (id: string) => {
    setSelectedFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!taskDescription || !checkInRateOG || !budgetOG || !selectedAgentId) return;
    setIsPending(true);
    setError(null);
    setIsSuccess(false);
    try {
      await createSubscription(
        BigInt(selectedAgentId),
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
  const selectedAgent = agents.find((a) => a.agentId.toString() === selectedAgentId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </Link>
        <div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Post a Subscription
          </h1>
          <p className="text-white/40 text-[14px]">
            Describe your recurring task. Agents with matching capabilities will appear on the right.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT — Form (7/12) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Task Description */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f1a]/80 backdrop-blur-sm p-6">
            <label className="block text-[12px] text-white/40 uppercase tracking-wider mb-3">Task Description</label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Describe what you want the agent to monitor or do — e.g. 'Daily crypto price alerts for BTC, ETH, SOL when price changes >5%'"
              rows={4}
              className="w-full bg-[#050810]/80 border border-white/[0.06] rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#38bdf8]/30 resize-none"
            />
          </div>

          {/* Interval + Rates row */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f1a]/80 backdrop-blur-sm p-6">
            <label className="block text-[12px] text-white/40 uppercase tracking-wider mb-3">Check-in Interval</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {INTERVAL_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setIntervalPreset(preset.seconds)}
                  className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all border ${
                    intervalPreset === preset.seconds
                      ? "border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]"
                      : "border-white/[0.08] text-white/40 hover:border-white/[0.15] hover:text-white/60"
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
                placeholder="Custom interval in seconds"
                className="w-full bg-[#050810]/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#38bdf8]/30"
              />
            )}
            {effectiveInterval > 0 && (
              <p className="text-[12px] text-white/30 mt-2">
                Agent will check in <span className="text-[#38bdf8]">{labelForInterval(effectiveInterval)}</span>
              </p>
            )}
          </div>

          {/* Rates row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Check-in Rate (OG)", value: checkInRateOG, onChange: setCheckInRateOG, placeholder: "0.01" },
              { label: "Alert Rate (OG)", value: alertRateOG, onChange: setAlertRateOG, placeholder: "0.05" },
              { label: "Initial Budget (OG)", value: budgetOG, onChange: setBudgetOG, placeholder: "1.0" },
            ].map((field) => (
              <div key={field.label} className="rounded-xl border border-white/[0.08] bg-[#0a0f1a]/80 p-4">
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-2">{field.label}</label>
                <input
                  type="number"
                  step="0.001"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-[#050810]/80 border border-white/[0.06] rounded-lg px-3 py-2 text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#38bdf8]/30"
                />
              </div>
            ))}
          </div>

          {/* Grace Period + Webhook row */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f1a]/80 backdrop-blur-sm p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[12px] text-white/40 uppercase tracking-wider mb-3">Grace Period</label>
                <div className="flex gap-2">
                  {GRACE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setGracePeriodPreset(preset.seconds)}
                      className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-medium transition-all border ${
                        gracePeriodPreset === preset.seconds
                          ? "border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]"
                          : "border-white/[0.08] text-white/40 hover:border-white/[0.15]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] text-white/40 uppercase tracking-wider mb-3">Webhook URL <span className="text-white/20 normal-case">(optional)</span></label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="w-full bg-[#050810]/80 border border-white/[0.06] rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#38bdf8]/30"
                />
              </div>
            </div>
          </div>

          {/* x402 Toggle */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f1a]/80 backdrop-blur-sm p-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setX402Enabled(!x402Enabled)}
                className={`relative w-12 h-6 rounded-full flex-shrink-0 transition-colors ${x402Enabled ? "bg-[#38bdf8]" : "bg-white/10"}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${x402Enabled ? "translate-x-7" : "translate-x-1"}`} />
              </button>
              <div className="flex-1">
                <p className="text-white text-[14px] font-medium">Enable x402 Protocol</p>
                <p className="text-white/30 text-[12px]">Allow agent to make paid API calls charged to this subscription</p>
              </div>
              {x402Enabled && (
                <div className="flex gap-2">
                  {[{ value: 0, label: "Agent-Side" }, { value: 1, label: "On-Chain" }].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setX402Mode(opt.value as 0 | 1)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                        x402Mode === opt.value
                          ? "border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]"
                          : "border-white/[0.08] text-white/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {selectedAgent && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#38bdf8]/20 bg-[#38bdf8]/5 backdrop-blur-sm p-5"
            >
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-3">Selected Agent</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-[15px]">{selectedAgent.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {selectedAgent.skills.slice(0, 4).map((s) => (
                      <CapabilityBadge key={s} label={s} />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#38bdf8] text-[16px] font-semibold">{selectedAgent.rateDisplay} OG</p>
                  <p className="text-white/30 text-[11px]">per task</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error / Success */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-[13px]">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3"
              >
                <p className="text-emerald-400 text-[13px]">Subscription created! Redirecting...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleCreate}
            disabled={!canSubmit}
            className="w-full px-6 py-4 bg-white text-black text-[15px] font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Creating...
              </span>
            ) : "Create Subscription"}
          </button>
        </div>

        {/* RIGHT — Agent List (5/12) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-2xl border border-white/[0.08] bg-[#0a0f1a]/80 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider">
                Choose Agent
              </h3>
              <span className="text-[12px] text-white/30">
                {filteredAgents.length} available
              </span>
            </div>

            {/* Capability Filters */}
            <div className="mb-4">
              <p className="text-[11px] text-white/30 mb-2 uppercase tracking-wider">Filter by capability</p>
              <div className="flex flex-wrap gap-2">
                {CAPABILITY_FILTERS.map((filter) => {
                  const isActive = selectedFilters.includes(filter.id);
                  const count = agents.filter((a) => a.isActive && a.skillIds.some((s) => s.toLowerCase().includes(filter.id.toLowerCase()))).length;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => toggleFilter(filter.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                        isActive
                          ? "border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]"
                          : "border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/60"
                      }`}
                    >
                      <span>{filter.icon}</span>
                      <span>{filter.label}</span>
                      {count > 0 && <span className="opacity-50 text-[10px]">({count})</span>}
                    </button>
                  );
                })}
              </div>
              {selectedFilters.length > 0 && (
                <button
                  onClick={() => setSelectedFilters([])}
                  className="mt-2 text-[11px] text-white/30 hover:text-white/60 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Agent List */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {agentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-white/[0.03] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-white/30 text-[13px]">
                    {selectedFilters.length > 0
                      ? "No agents match selected capabilities"
                      : "No active agents available"}
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredAgents.map((agent) => (
                    <motion.div
                      key={agent.agentId}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <AgentCard
                        agent={agent}
                        isSelected={selectedAgentId === agent.agentId.toString()}
                        onClick={() => setSelectedAgentId(agent.agentId.toString())}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Selected indicator */}
            {selectedAgentId && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[12px] text-white/40">Agent #{selectedAgentId}</span>
                <button
                  onClick={() => setSelectedAgentId("")}
                  className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
                >
                  Deselect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}