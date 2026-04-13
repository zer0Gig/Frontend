"use client";

import React from "react";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Lock, RefreshCw, Clipboard, Dna, Bot, Scale, Globe, Plug } from "lucide-react";
import ShinyText from "./ShinyText/ShinyText";

const CARDS = [
  {
    phase: "Phase 1",
    phaseColor: "#38bdf8",
    phaseBg: "rgba(56,189,248,0.08)",
    phaseBorder: "rgba(56,189,248,0.25)",
    glowColor: "rgba(56,189,248,0.15)",
    badge: "ERC-7857",
    badgeBy: "0G Labs",
    title: "Intelligent NFT (iNFT)",
    subtitle: "Self-Verifying Agent Identity",
    description:
      "Upgrade AgentRegistry from ERC-721 to ERC-7857 — the AI agent NFT standard proposed by 0G Labs. Agent capability data becomes encrypted and cryptographically verifiable on transfer.",
    currentLabel: "Current: ERC-721",
    currentNote: "Already aligned — capabilityHash + eciesPublicKey mirror ERC-7857's IntelligentData model.",
    gains: [
      { icon: "🔐", label: "Encrypted capability data", sub: "Model weights & skills never exposed on-chain" },
      { icon: "🔄", label: "Proof-gated transfers", sub: "TEE/ZKP re-encryption on ownership change" },
      { icon: "📋", label: "Usage authorization", sub: "License agents to multiple clients without transferring ownership" },
      { icon: "🧬", label: "Agent cloning", sub: "iClone() — mint a verified copy for a new owner" },
    ],
    eipUrl: "https://eips.ethereum.org/EIPS/eip-7857",
    eipStatus: "Draft · Jan 2025",
  },
  {
    phase: "Phase 2",
    phaseColor: "#a855f7",
    phaseBg: "rgba(168,85,247,0.08)",
    phaseBorder: "rgba(168,85,247,0.25)",
    glowColor: "rgba(168,85,247,0.15)",
    badge: "ERC-8183",
    badgeBy: "Virtuals Protocol + Ethereum Foundation dAI",
    title: "Agentic Commerce Protocol",
    subtitle: "Standardized Job Escrow for Agent-to-Agent Hiring",
    description:
      "Align ProgressiveEscrow with ERC-8183 — the on-chain job primitive that enables any AI agent to hire another autonomously with cryptographic payment guarantees.",
    currentLabel: "Current: Custom Escrow",
    currentNote: "Already aligned — our 6-state job lifecycle mirrors ERC-8183's fund → submit → complete flow.",
    gains: [
      { icon: "🤖", label: "Agent-to-agent hiring", sub: "Client can itself be an AI agent, no human needed" },
      { icon: "🔌", label: "IACPHook composability", sub: "Before/after hooks on every job state transition" },
      { icon: "⚖️", label: "Pluggable evaluator", sub: "AI judge, ZK verifier, DAO, or multisig as quality oracle" },
      { icon: "🌐", label: "Cross-platform jobs", sub: "Interoperable with any ERC-8183 compliant marketplace" },
    ],
    eipUrl: "https://eips.ethereum.org/EIPS/eip-8183",
    eipStatus: "Draft · Feb 2026",
  },
];

const GAIN_ICONS: Record<string, React.ReactNode> = {
  "🔐": <Lock size={16} />,
  "🔄": <RefreshCw size={16} />,
  "📋": <Clipboard size={16} />,
  "🧬": <Dna size={16} />,
  "🤖": <Bot size={16} />,
  "🔌": <Plug size={16} />,
  "⚖️": <Scale size={16} />,
  "🌐": <Globe size={16} />,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

export default function RoadmapSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-24 px-4 overflow-hidden">
      {/* Background glow blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#38bdf8]/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#a855f7]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={0}
          className="text-center mb-14"
        >
          {/* Pulse badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/8 px-3 py-1.5 text-[11px] font-bold text-[#38bdf8] uppercase tracking-widest backdrop-blur-md mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38bdf8] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38bdf8]" />
            </span>
            Post-Hackathon Roadmap
          </div>

          <h2
            style={{
              background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            <ShinyText
              text="The Next Evolution of zer0Gig"
              speed={3}
              color="rgba(255,255,255,0.85)"
              shineColor="#22d3ee"
              spread={110}
              yoyo
              className="text-3xl md:text-5xl font-medium"
            />
          </h2>
          <p className="text-white/50 text-[15px] max-w-2xl mx-auto leading-relaxed">
            After submission, we&apos;re upgrading to the latest Ethereum standards for AI agent commerce —
            purpose-built for the agentic economy zer0Gig is building toward.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.badge}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={i + 1}
              className="group relative rounded-2xl border bg-[#0d1525]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: card.phaseBorder,
                boxShadow: `0 0 0 0 ${card.glowColor}`,
              }}
              whileHover={{
                boxShadow: `0 0 40px -8px ${card.glowColor}`,
              }}
            >
              {/* Top gradient bar */}
              <div
                className="h-[2px] w-full"
                style={{ background: `linear-gradient(to right, ${card.phaseColor}, transparent)` }}
              />

              <div className="p-6">
                {/* Phase tag + EIP badge */}
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                    style={{ background: card.phaseBg, color: card.phaseColor }}
                  >
                    {card.phase}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                      style={{
                        borderColor: card.phaseBorder,
                        color: card.phaseColor,
                        background: card.phaseBg,
                      }}
                    >
                      {card.badge}
                    </span>
                    <span className="text-white/30 text-[10px]">{card.eipStatus}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-white text-[18px] font-semibold mb-1">{card.title}</h3>
                <p className="text-white/40 text-[12px] mb-3">{card.subtitle}</p>
                <p className="text-white/55 text-[13px] leading-relaxed mb-5">{card.description}</p>

                {/* Current alignment note */}
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 mb-5">
                  <div className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-400">{card.currentLabel}</span>
                      <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{card.currentNote}</p>
                    </div>
                  </div>
                </div>

                {/* Gains list */}
                <ul className="space-y-2.5 mb-6">
                  {card.gains.map((g) => (
                    <li key={g.label} className="flex items-start gap-3">
                      <span className="text-base leading-none mt-0.5 text-[#00e5a0]">{GAIN_ICONS[g.icon] || g.icon}</span>
                      <div>
                        <span className="text-[13px] text-white/80 font-medium">{g.label}</span>
                        <p className="text-[11px] text-white/35 mt-0.5">{g.sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <span className="text-[11px] text-white/30">{card.badgeBy}</span>
                  <a
                    href={card.eipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] font-medium transition-colors"
                    style={{ color: card.phaseColor }}
                  >
                    View EIP
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={3}
          className="mt-10 text-center"
        >
          <p className="text-white/25 text-[12px] max-w-xl mx-auto leading-relaxed">
            Both standards are currently in <span className="text-white/45">Draft</span> status on the Ethereum Improvement Process.
            zer0Gig&apos;s current architecture is intentionally designed to align with them — the migration is additive, not a rewrite.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
