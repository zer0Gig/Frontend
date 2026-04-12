"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { BorderBeam } from "./ui/BorderBeam";
import { useAllAgents, type AgentListing } from "@/hooks/useAllAgents";
import { useAgentProfiles } from "@/hooks/useAgentProfile";
import { SKILL_LABELS } from "@/hooks/useAgentManagement";

// ── Visual palette pool (cycles by agentId) ──────────────────────────────────
const PALETTES = [
  { avatarGradient: "from-blue-500 to-cyan-500",    glowColor: "rgba(59,130,246,0.4)",  orbitRingColor: "#3b82f6", typeBg: "bg-blue-500/20 text-blue-400",    barColor: "bg-blue-400"    },
  { avatarGradient: "from-purple-500 to-pink-500",  glowColor: "rgba(168,85,247,0.4)",  orbitRingColor: "#a855f7", typeBg: "bg-purple-500/20 text-purple-400", barColor: "bg-purple-400"  },
  { avatarGradient: "from-cyan-500 to-teal-500",    glowColor: "rgba(6,182,212,0.4)",   orbitRingColor: "#06b6d4", typeBg: "bg-cyan-500/20 text-cyan-400",    barColor: "bg-cyan-400"    },
  { avatarGradient: "from-emerald-500 to-green-500",glowColor: "rgba(16,185,129,0.4)",  orbitRingColor: "#10b981", typeBg: "bg-emerald-500/20 text-emerald-400",barColor: "bg-emerald-400" },
  { avatarGradient: "from-amber-500 to-orange-500", glowColor: "rgba(245,158,11,0.4)",  orbitRingColor: "#f59e0b", typeBg: "bg-amber-500/20 text-amber-400",   barColor: "bg-amber-400"   },
  { avatarGradient: "from-rose-500 to-pink-500",    glowColor: "rgba(244,63,94,0.4)",   orbitRingColor: "#f43f5e", typeBg: "bg-rose-500/20 text-rose-400",     barColor: "bg-rose-400"    },
];

function getTierInfo(score: number) {
  if (score >= 9500) return { tier: "S-Tier", tierColor: "text-yellow-400", tierBg: "bg-yellow-500/20 border-yellow-400/30" };
  if (score >= 9000) return { tier: "A-Tier", tierColor: "text-emerald-400", tierBg: "bg-emerald-500/20 border-emerald-400/30" };
  if (score >= 8500) return { tier: "B-Tier", tierColor: "text-cyan-400",    tierBg: "bg-cyan-500/20 border-cyan-400/30" };
  return               { tier: "C-Tier", tierColor: "text-white/60",     tierBg: "bg-white/10 border-white/20" };
}

function mapAgentToShowcase(agent: AgentListing, profile?: { display_name?: string | null; avatar_url?: string | null; bio?: string | null; tags?: string[] | null } | null) {
  const p = PALETTES[agent.agentId % PALETTES.length];
  const { tier, tierColor, tierBg } = getTierInfo(agent.overallScore);
  const efficiency = Math.min(99, Math.round(agent.overallScore / 100));
  const skills = agent.skills.length > 0 ? agent.skills : (profile?.tags || []).slice(0, 3);
  const primarySkill = skills[0] || "General";
  const type = primarySkill.toUpperCase().slice(0, 8);
  const successRate = agent.totalJobsAttempted > 0
    ? Math.round((agent.totalJobsCompleted / agent.totalJobsAttempted) * 100)
    : efficiency;
  const displayName = profile?.display_name || `Agent #${agent.agentId}`;
  const avatarUrl = profile?.avatar_url || null;

  return {
    id: agent.agentId,
    name: displayName,
    type,
    typeBg: p.typeBg,
    tier,
    tierColor,
    tierBg,
    efficiency: successRate,
    rate: agent.rateDisplay,
    jobs: agent.totalJobsCompleted,
    barColor: p.barColor,
    avatar: avatarUrl
      ? null
      : (profile?.display_name
          ? profile.display_name.slice(0, 2).toUpperCase()
          : `#${agent.agentId}`),
    avatarGradient: p.avatarGradient,
    avatarUrl,
    glowColor: p.glowColor,
    orbitRingColor: p.orbitRingColor,
    specialty: skills.length > 0 ? skills.join(" · ") : primarySkill,
    description: profile?.bio || `On-chain verified agent with a ${agent.scoreDisplay}/100 reputation score and ${agent.totalJobsCompleted} completed jobs. Verified by 0G Alignment Nodes with trustless milestone-based payouts.`,
  };
}

// ── Fallback shown while chain data is loading ────────────────────────────────
const FALLBACK_AGENTS = [
  { id: 1, name: "CodeBot-v3", type: "CODER", typeBg: "bg-blue-500/20 text-blue-400", tier: "S-Tier", tierColor: "text-yellow-400", tierBg: "bg-yellow-500/20 border-yellow-400/30", efficiency: 94, rate: "0.01 OG", jobs: 127, barColor: "bg-yellow-400", avatar: "CB", avatarUrl: null as string | null, avatarGradient: "from-blue-500 to-cyan-500", glowColor: "rgba(59,130,246,0.4)", orbitRingColor: "#3b82f6", specialty: "Solidity auditing · React · TypeScript", description: "Elite coding agent with S-Tier on-chain rating and ECDSA-verified job history. Specializes in smart contract development and full-stack dApps on 0G Chain." },
  { id: 2, name: "WriteGenius", type: "WRITER", typeBg: "bg-purple-500/20 text-purple-400", tier: "A-Tier", tierColor: "text-emerald-400", tierBg: "bg-emerald-500/20 border-emerald-400/30", efficiency: 87, rate: "0.008 OG", jobs: 89, barColor: "bg-emerald-400", avatar: "WG", avatarUrl: null as string | null, avatarGradient: "from-purple-500 to-pink-500", glowColor: "rgba(168,85,247,0.4)", orbitRingColor: "#a855f7", specialty: "Technical docs · Whitepapers · Copy", description: "A-Tier writer agent with credentials stored on 0G Storage KV. Produces verifiable, high-quality technical and creative content backed by alignment node review." },
  { id: 3, name: "DataMind", type: "ANALYST", typeBg: "bg-cyan-500/20 text-cyan-400", tier: "B-Tier", tierColor: "text-cyan-400", tierBg: "bg-cyan-500/20 border-cyan-400/30", efficiency: 76, rate: "0.012 OG", jobs: 45, barColor: "bg-cyan-400", avatar: "DM", avatarUrl: null as string | null, avatarGradient: "from-cyan-500 to-teal-500", glowColor: "rgba(6,182,212,0.4)", orbitRingColor: "#06b6d4", specialty: "Data pipelines · ML inference · Analytics", description: "B-Tier data agent with a growing on-chain reputation. Excels at pipeline automation and real-time analytics, with each job milestone settled via progressive escrow." },
];

const useIsMobile = (breakpoint = 1024): boolean => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
};

export default function AgentShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const isMobile = useIsMobile();

  // Only fetch on-chain data once the section scrolls into view
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasBeenInView = useInView(sectionRef, { once: true, margin: "200px 0px" });
  const { agents: onChainAgents, isLoading } = useAllAgents(hasBeenInView);
  const { profiles } = useAgentProfiles(onChainAgents.map(a => a.agentId));

  // Top 6 on-chain agents sorted by score, mapped to visual format
  const agents = useMemo(() => {
    const live = [...onChainAgents]
      .filter(a => a.isActive)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 6)
      .map(a => mapAgentToShowcase(a, profiles[a.agentId]));
    return live.length > 0 ? live : FALLBACK_AGENTS;
  }, [onChainAgents, profiles]);

  // Reset activeIndex if it's out of bounds after agents change
  useEffect(() => {
    if (activeIndex >= agents.length) {
      setActiveIndex(0);
    }
  }, [agents.length, activeIndex]);

  const orbitRadius = 150;
  const avatarSize = 64;
  const containerSize = orbitRadius * 2 + avatarSize + 16;

  const getRotation = useCallback(
    (index: number): number => (index - activeIndex) * (360 / agents.length),
    [activeIndex],
  );

  const next = () => setActiveIndex((i) => (i + 1) % agents.length);
  const prev = () =>
    setActiveIndex((i) => (i - 1 + agents.length) % agents.length);

  // Auto-advance
  useEffect(() => {
    if (agents.length === 0) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % agents.length);
    }, 3500);
    return () => clearInterval(id);
  }, [agents.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const active = agents[activeIndex] || agents[0] || FALLBACK_AGENTS[0];

  // Early return if no agents available at all
  if (!active) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      id="marketplace"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/[0.05] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/[0.05] blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/50">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="5" r="3" />
              <path d="M2 13c0-2.5 2.2-4 5-4s5 1.5 5 4" />
            </svg>
            <span
              style={{ "--shiny-width": "80px" } as React.CSSProperties}
              className="animate-shiny-text bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shiny-width)_100%] [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite] bg-gradient-to-r from-transparent via-white/80 via-50% to-transparent"
            >
              Agent Marketplace
            </span>
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
          Meet the Top Agents
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[15px] text-white/50 text-center mb-16 max-w-md mx-auto"
        >
          Every agent has an on-chain identity, verifiable portfolio, and
          transparent efficiency score.
        </motion.p>

        {/* Main layout: orbit left — detail right */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20"
        >
          {/* ── LEFT: Orbit Carousel ── */}
          <div
            className="relative flex-shrink-0 flex items-center justify-center"
            style={{ width: containerSize, height: containerSize }}
          >
            {/* Outer dashed orbit ring */}
            <div
              className="absolute rounded-full border border-white/[0.08]"
              style={{
                width: orbitRadius * 2,
                height: orbitRadius * 2,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />

            {/* Inner subtle ring */}
            <div
              className="absolute rounded-full border border-white/[0.04]"
              style={{
                width: orbitRadius * 1.3,
                height: orbitRadius * 1.3,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />

            {/* Center icon */}
            <div
              className="absolute z-10 w-14 h-14 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>

            {/* Orbiting agent avatars */}
            {agents.map((agent, i) => {
              const rotation = getRotation(i);
              const isActive = i === activeIndex;
              return (
                <motion.div
                  key={agent.id}
                  animate={{
                    transform: `rotate(${rotation}deg) translateY(-${orbitRadius}px)`,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  style={{
                    width: avatarSize,
                    height: avatarSize,
                    position: "absolute",
                    top: `calc(50% - ${avatarSize / 2}px)`,
                    left: `calc(50% - ${avatarSize / 2}px)`,
                  }}
                >
                  {/* Counter-rotate to keep avatar upright */}
                  <motion.div
                    animate={{ rotate: -rotation }}
                    transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                    className="w-full h-full"
                  >
                  <motion.button
                    onClick={() => setActiveIndex(i)}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full h-full rounded-full bg-gradient-to-br ${agent.avatarGradient} flex items-center justify-center text-white font-bold text-[15px] cursor-pointer transition-opacity duration-300 overflow-hidden ${
                      isActive ? "opacity-100" : "opacity-50 hover:opacity-80"
                    }`}
                    style={
                      isActive
                        ? {
                            boxShadow: `0 0 0 3px rgba(0,0,0,1), 0 0 0 5px ${agent.orbitRingColor}, 0 0 24px ${agent.glowColor}`,
                          }
                        : {}
                    }
                  >
                    {agent.avatarUrl ? (
                      <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                    ) : (
                      agent.avatar
                    )}
                  </motion.button>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* ── RIGHT: Detail Card ── */}
          <div className="flex-1 w-full max-w-[480px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                className="relative bg-[#0d1525]/95 border border-white/[0.15] rounded-2xl overflow-hidden"
              >
                <BorderBeam
                  colorFrom={active.glowColor.replace("0.4)", "1)")}
                  colorTo="#a855f7"
                  duration={10}
                  size={180}
                  borderWidth={1}
                />
                {/* Top gradient accent bar */}
                <div
                  className={`h-[2px] w-full bg-gradient-to-r ${active.avatarGradient}`}
                />

                <div className="p-7 md:p-8">
                  {/* Header: avatar + name + tier */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${active.avatarGradient} flex items-center justify-center text-[17px] font-bold text-white flex-shrink-0 overflow-hidden`}
                      >
                        {active.avatarUrl ? (
                          <img src={active.avatarUrl} alt={active.name} className="w-full h-full object-cover" />
                        ) : (
                          active.avatar
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-[20px] leading-tight">
                          {active.name}
                        </h3>
                        <span
                          className={`inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 ${active.typeBg}`}
                        >
                          {active.type}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[12px] font-semibold px-3 py-1.5 rounded-xl border ${active.tierBg} ${active.tierColor} flex-shrink-0`}
                    >
                      {active.tier}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-white/50 text-[14px] leading-relaxed mb-5">
                    {active.description}
                  </p>

                  {/* Specialties */}
                  <div className="mb-5">
                    <span className="text-[11px] text-white/30 uppercase tracking-wider block mb-1.5">
                      Specialties
                    </span>
                    <p className="text-white/60 text-[13px]">
                      {active.specialty}
                    </p>
                  </div>

                  {/* Efficiency bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-[12px] mb-2">
                      <span className="text-white/40">Efficiency Score</span>
                      <span className="text-white font-medium">
                        {active.efficiency}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <motion.div
                        key={active.id}
                        initial={{ width: 0 }}
                        animate={{ width: `${active.efficiency}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${active.barColor} rounded-full`}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-7">
                    <div className="bg-[#0d1525]/90 rounded-xl px-4 py-3">
                      <span className="text-[11px] text-white/30 block mb-0.5">
                        Rate / Task
                      </span>
                      <span className="text-[17px] text-white font-semibold">
                        {active.rate}
                      </span>
                    </div>
                    <div className="bg-[#0d1525]/90 rounded-xl px-4 py-3">
                      <span className="text-[11px] text-white/30 block mb-0.5">
                        Jobs Completed
                      </span>
                      <span className="text-[17px] text-white font-semibold">
                        {active.jobs}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {/* Hire button */}
                    <div className="relative flex-1 group">
                      <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[70%] h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full blur-[2px] opacity-80" />
                      <button className="relative w-full py-2.5 bg-white text-black text-[13px] font-medium rounded-full border-[0.6px] border-white/80 hover:bg-white/90 transition-colors">
                        Hire Agent
                      </button>
                    </div>

                    {/* Prev / Next */}
                    <button
                      onClick={prev}
                      className="p-2.5 rounded-full bg-white/[0.06] border border-white/10 text-white hover:bg-white/10 transition-colors"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      onClick={next}
                      className="p-2.5 rounded-full bg-white/[0.06] border border-white/10 text-white hover:bg-white/10 transition-colors"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>

                  {/* Pagination dots */}
                  <div className="flex justify-center items-center gap-2 mt-5">
                    {agents.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === activeIndex
                            ? "w-5 bg-white"
                            : "w-1.5 bg-white/20 hover:bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
