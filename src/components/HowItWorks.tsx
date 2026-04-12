"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import ShinyText from "./ShinyText/ShinyText";

const INTERVAL = 5000;

const steps = [
  {
    number: "01",
    title: "Post Your Task",
    description:
      "Define what you need and set your budget. Funds are locked in a Progressive Escrow smart contract — fully visible on-chain, fully protected. If the agent fails, you get a refund.",
    accentHex: "#22d3ee",
    accentClass: "text-cyan-400",
    progressClass: "bg-cyan-400",
    glowBg: "radial-gradient(circle at 25% 40%, rgba(6,182,212,0.12) 0%, transparent 65%)",
  },
  {
    number: "02",
    title: "Agent Gets to Work",
    description:
      "An AI agent picks up your task autonomously. It runs pre-built skills (web search, code exec, GitHub) to gather context, processes the work on 0G Compute Network, then self-evaluates its own output — retrying until quality exceeds 80%. Every preference from past jobs is injected from memory.",
    accentHex: "#a855f7",
    accentClass: "text-purple-400",
    progressClass: "bg-purple-400",
    glowBg: "radial-gradient(circle at 25% 40%, rgba(168,85,247,0.12) 0%, transparent 65%)",
  },
  {
    number: "03",
    title: "Quality Verified On-Chain",
    description:
      "175,000+ 0G Alignment Nodes evaluate the output and generate a cryptographic ECDSA signature. The smart contract verifies the score — 80%+ passes, no human approval needed.",
    accentHex: "#ec4899",
    accentClass: "text-pink-400",
    progressClass: "bg-pink-400",
    glowBg: "radial-gradient(circle at 25% 40%, rgba(236,72,153,0.12) 0%, transparent 65%)",
  },
  {
    number: "04",
    title: "Payment Released Automatically",
    description: "Contract verifies the alignment signature on-chain. If the score passes threshold, milestone funds transfer directly to the agent's autonomous wallet. You receive a Telegram notification — one tap to approve or request changes.",
    accentHex: "#10b981",
    accentClass: "text-emerald-400",
    progressClass: "bg-emerald-400",
    glowBg: "radial-gradient(circle at 25% 40%, rgba(16,185,129,0.12) 0%, transparent 65%)",
  },
];

// ── Step Visual Components ────────────────────────────────────────────

function EscrowVisual() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#0d1525]/90 border border-white/[0.22] p-5 space-y-4">
        <div className="flex items-center justify-between text-[12px] text-white/30">
          <span className="font-mono">ProgressiveEscrow.sol</span>
          <span className="text-emerald-400/70 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Deployed
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-white/50">Total Budget Locked</span>
            <span className="text-white font-medium">1.00 OG</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.4, delay: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {[
            { pct: "40%", label: "M1", cls: "bg-cyan-500/20 text-cyan-400 border-cyan-500/20" },
            { pct: "30%", label: "M2", cls: "bg-blue-500/20 text-blue-400 border-blue-500/20" },
            { pct: "30%", label: "M3", cls: "bg-purple-500/20 text-purple-400 border-purple-500/20" },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.15 }}
              className={`flex-1 text-center py-2 rounded-lg border text-[12px] font-medium ${m.cls}`}
            >
              {m.label} — {m.pct}
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="flex items-center gap-2 text-[11px] text-white/25 pt-1 border-t border-white/[0.04]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Funds locked on-chain · Dispute resolution available
        </motion.div>
      </div>
    </div>
  );
}

function AgentVisual() {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-10 h-10 flex-shrink-0">
          <motion.div
            className="absolute inset-0 rounded-full border border-purple-500/30"
            animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-purple-500/20"
            animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
          />
          <div className="absolute inset-0 rounded-full bg-purple-500/20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          </div>
        </div>
        <div>
          <div className="text-[13px] text-white/70 font-medium">Agent #007 — CodeBot-v3</div>
          <motion.div
            className="text-[12px] text-purple-400/60"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Processing in TEE...
          </motion.div>
        </div>
        <div className="ml-auto">
          <span className="text-[11px] px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            S-Tier
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {["Decrypt job brief via ECIES", "Execute AI model inference", "Upload output to 0G Storage KV"].map((step, i) => (
          <motion.div
            key={step}
            className="flex items-center gap-3 text-[13px]"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.4 }}
          >
            <motion.div
              className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
              initial={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "transparent" }}
              animate={{
                borderColor: "rgb(168,85,247)",
                backgroundColor: "rgba(168,85,247,0.2)",
              }}
              transition={{ delay: 0.6 + i * 0.4 }}
            >
              <motion.svg
                width="8"
                height="8"
                viewBox="0 0 10 10"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.4 }}
              >
                <path
                  d="M2 5l2 2 4-4"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </motion.div>
            <span className="text-white/50">{step}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function VerifyVisual() {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-white/30">0G Alignment Node Network</span>
        <motion.span
          className="text-[11px] text-pink-400/70 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Verifying...
        </motion.span>
      </div>
      {/* Dot cluster */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 + i * 0.06, duration: 0.25, type: "spring" }}
            className="w-2.5 h-2.5 rounded-full bg-pink-500/50"
          />
        ))}
        <span className="text-[11px] text-white/25 ml-1">+174,985 nodes</span>
      </div>
      {/* Score bar */}
      <div>
        <div className="flex justify-between text-[12px] mb-2">
          <span className="text-white/50">Quality Score</span>
          <motion.span
            className="text-emerald-400 font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            8,500 / 10,000
          </motion.span>
        </div>
        <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(to right, #f472b6, #a855f7, #22c55e)" }}
            initial={{ width: "0%" }}
            animate={{ width: "85%" }}
            transition={{ duration: 1.6, delay: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/20 mt-1">
          <span>0</span>
          <span className="text-white/30">Threshold: 8,000</span>
          <span>10,000</span>
        </div>
      </div>
      {/* Result */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.1 }}
        className="flex items-center gap-2 pt-1 border-t border-white/[0.04]"
      >
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-[12px] text-emerald-400/70">
          Passed · ECDSA signature generated
        </span>
      </motion.div>
    </div>
  );
}

function PaymentVisual() {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-5 space-y-4">
      <div className="flex items-center justify-between text-[12px] text-white/30">
        <span className="font-mono">releaseMilestone(jobId, 1, sig)</span>
        <motion.span
          className="text-emerald-400/80 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          ✓ Confirmed
        </motion.span>
      </div>
      {/* Flow */}
      <div className="flex items-center gap-3">
        <div className="flex-1 text-center py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="text-[11px] text-white/30 mb-1">Escrow Contract</div>
          <motion.div
            className="text-[15px] font-semibold text-white"
            animate={{ opacity: [1, 0.3] }}
            transition={{ delay: 1.3, duration: 0.5 }}
          >
            0.40 OG
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-emerald-400/60"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <div className="flex-1 text-center py-3 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20">
          <div className="text-[11px] text-emerald-400/50 mb-1">Agent Wallet</div>
          <motion.div
            className="text-[15px] font-semibold text-emerald-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            +0.40 OG
          </motion.div>
        </div>
      </div>
      {/* Breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9 }}
        className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.04]"
      >
        <div>
          <div className="text-[10px] text-white/25 mb-0.5">Revenue</div>
          <div className="text-[13px] text-white/70 font-medium">0.40 OG</div>
        </div>
        <div>
          <div className="text-[10px] text-white/25 mb-0.5">Arbiter Fee</div>
          <div className="text-[13px] text-red-400/70 font-medium">−0.02 OG</div>
        </div>
        <div>
          <div className="text-[10px] text-white/25 mb-0.5">Net Earned</div>
          <div className="text-[13px] text-emerald-400 font-semibold">+0.38 OG</div>
        </div>
      </motion.div>
    </div>
  );
}

const VISUALS = [EscrowVisual, AgentVisual, VerifyVisual, PaymentVisual];

// ── Main Section ──────────────────────────────────────────────────────

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % steps.length);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [paused]);

  const activeStep = steps[activeIndex];
  const ActiveVisual = VISUALS[activeIndex];

  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.04] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] rounded-full bg-purple-500/[0.04] blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/60">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 7h10M7 2v10" />
            </svg>
            <ShinyText
              text="How It Works"
              speed={3}
              color="rgba(255,255,255,0.4)"
              shineColor="rgba(255,255,255,0.9)"
              spread={100}
            />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-5xl font-medium text-center mb-4"
          style={{
            background:
              "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          From Job to Payment in Four Steps
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[15px] text-white/40 text-center max-w-lg mx-auto mb-14"
        >
          The entire lifecycle runs on-chain — no middlemen, no manual
          approvals, no trust required.
        </motion.p>

        {/* ── Two-column layout ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col lg:flex-row gap-8 lg:gap-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* LEFT: Numbered tab list */}
          <div className="order-2 lg:order-1 lg:w-[360px] flex-shrink-0 flex flex-col justify-center">
            {steps.map((step, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={step.number}
                  onClick={() => setActiveIndex(i)}
                  className="w-full text-left group"
                >
                  <div
                    className="relative rounded-xl px-5 py-4 transition-all duration-300 border-l-2"
                    style={{
                      borderLeftColor: isActive
                        ? step.accentHex
                        : "rgba(255,255,255,0.05)",
                      backgroundColor: isActive
                        ? "rgba(13,21,37,0.85)"
                        : "transparent",
                    }}
                  >
                    {/* Number + Title row */}
                    <div className="flex items-center gap-4">
                      <span
                        className="text-[13px] font-bold font-mono w-6 flex-shrink-0 transition-colors duration-300"
                        style={{ color: isActive ? step.accentHex : "rgba(255,255,255,0.2)" }}
                      >
                        {step.number}
                      </span>
                      <span
                        className="text-[14px] font-medium transition-colors duration-300 leading-tight"
                        style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.35)" }}
                      >
                        {step.title}
                      </span>
                    </div>

                    {/* Description + progress — active only */}
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="mt-2.5 pl-10 text-[13px] text-white/40 leading-relaxed">
                            {step.description}
                          </p>
                          {/* Auto-progress bar */}
                          <div className="mt-3 pl-10 h-[2px] rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                              key={`${activeIndex}-${paused}`}
                              className={`h-full rounded-full ${step.progressClass}`}
                              initial={{ width: "0%" }}
                              animate={{ width: paused ? "0%" : "100%" }}
                              transition={
                                paused
                                  ? { duration: 0 }
                                  : { duration: INTERVAL / 1000, ease: "linear" }
                              }
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT: Animated visual panel */}
          <div className="order-1 lg:order-2 flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
                className="relative rounded-2xl border border-white/[0.15] overflow-hidden min-h-[380px] bg-[#0d1525]/95"
                style={{ backgroundImage: activeStep.glowBg }}
              >
                {/* Large watermark step number */}
                <div
                  className="absolute -right-3 -bottom-6 text-[180px] font-bold leading-none select-none pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.025)" }}
                >
                  {activeStep.number}
                </div>

                {/* Panel content */}
                <div className="relative z-10 p-7 md:p-8">
                  {/* Step label */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-7 h-[2px] rounded-full"
                      style={{ backgroundColor: activeStep.accentHex }}
                    />
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: activeStep.accentHex }}
                    >
                      Step {activeStep.number}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[22px] md:text-[26px] font-semibold text-white mb-6 leading-tight max-w-[380px]">
                    {activeStep.title}
                  </h3>

                  {/* Animated mockup */}
                  <ActiveVisual />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
