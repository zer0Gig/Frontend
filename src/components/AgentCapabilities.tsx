"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { animate } from "animejs";
import { PhaseIcon, phaseColor } from "@/components/ui/PhaseIcon";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { SkillBadge } from "@/components/ui/SkillBadge";
import { BorderBeam } from "@/components/ui/BorderBeam";

// ── Reusable section label ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[11px] text-white/40 uppercase tracking-widest font-medium">
      {children}
    </span>
  );
}

// ── Capability card ────────────────────────────────────────────────────────────

function CapCard({
  title,
  description,
  accent,
  delay = 0,
  children,
}: {
  title: string;
  description: string;
  accent: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="rounded-2xl border border-white/[0.08] bg-[#0a1220]/80 p-5 flex flex-col gap-4 hover:border-white/[0.14] transition-colors group"
    >
      <BorderBeam
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        colorFrom={accent}
        colorTo={accent}
        size={300}
        duration={12}
        borderWidth={2}
      />
      {/* Visual */}
      <div className="rounded-xl border border-white/[0.06] bg-[#050810]/60 p-4 min-h-[140px] flex items-center justify-center overflow-hidden">
        {children}
      </div>
      {/* Text */}
      <div>
        <h3 className="text-[15px] font-semibold text-white mb-1.5" style={{ textShadow: `0 0 20px ${accent}44` }}>
          {title}
        </h3>
        <p className="text-[13px] text-white/40 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// ── Self-Evaluation visual ────────────────────────────────────────────────────

function SelfEvalVisual() {
  const phases: { phase: string; label: string; score?: number }[] = [
    { phase: "processing",  label: "LLM generates output" },
    { phase: "self_review", label: "Agent self-evaluates", score: 6800 },
    { phase: "processing",  label: "Improvement prompt sent" },
    { phase: "self_review", label: "Re-evaluates", score: 9200 },
    { phase: "completed",   label: "Passes threshold (80%)" },
  ];

  return (
    <div className="w-full space-y-2">
      {phases.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12, duration: 0.35 }}
          className="flex items-center gap-2.5"
        >
          <PhaseIcon phase={p.phase} size={13} className={phaseColor(p.phase)} />
          <span className="text-[11px] text-white/50 flex-1">{p.label}</span>
          {p.score != null && (
            <ScoreBadge score={p.score} size="xs" showLabel />
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── Skills visual ─────────────────────────────────────────────────────────────

function SkillsVisual() {
  const skills = [
    { id: "web_search",      name: "Web Search",    category: "data" },
    { id: "http_fetch",      name: "HTTP Fetch",    category: "data" },
    { id: "github_reader",   name: "GitHub",        category: "code" },
    { id: "code_exec",       name: "Code Exec",     category: "code" },
    { id: "telegram_notify", name: "Telegram",      category: "communication" },
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {skills.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
        >
          <SkillBadge id={s.id} name={s.name} category={s.category} size="sm" />
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.55, type: "spring" }}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-dashed border-white/15 text-[11px] text-white/25"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Your custom tool
      </motion.div>
    </div>
  );
}

// ── Memory visual ─────────────────────────────────────────────────────────────

function MemoryVisual() {
  const entries = [
    { client: "0x4a2f…", type: "frontend-dev", score: 9200, learnings: ["Prefers Tailwind CSS", "Dark mode always"] },
    { client: "0x9c1e…", type: "solidity-dev",  score: 8400, learnings: ["OpenZeppelin 5.0+", "Add NatSpec comments"] },
  ];

  return (
    <div className="w-full space-y-2.5">
      {entries.map((e, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 0.4 }}
          className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 flex items-start gap-3"
        >
          <ScoreBadge score={e.score} size="xs" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-white/35 font-mono">{e.client}</span>
              <span className="text-[9px] text-white/20 px-1.5 py-0.5 rounded-full border border-white/10">{e.type}</span>
            </div>
            {e.learnings.map((l, j) => (
              <div key={j} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-blue-400/50 flex-shrink-0" />
                <p className="text-[10px] text-white/45 truncate">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Telegram visual ───────────────────────────────────────────────────────────

function TelegramVisual() {
  const messages = [
    { from: "bot",  text: "✅ Milestone 1 complete! 3 React components built. Review and approve?" },
    { from: "user", text: "Looks good! Approve" },
    { from: "bot",  text: "Payment released — 0.25 OG → agent wallet" },
  ];

  return (
    <div className="w-full space-y-2">
      {/* Phone mockup */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-3 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.07]">
          <div className="w-6 h-6 rounded-full bg-[#38bdf8]/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#38bdf8]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
            </svg>
          </div>
          <span className="text-[11px] text-white/50 font-medium">zer0Gig Bot</span>
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2, duration: 0.35 }}
            className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[10px] leading-relaxed ${
              m.from === "user"
                ? "bg-[#38bdf8]/20 text-[#38bdf8]"
                : "bg-white/[0.07] text-white/60"
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {/* Approve button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="flex gap-1.5 pt-1"
        >
          <div className="flex-1 text-center py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400 font-medium">
            ✓ Approve
          </div>
          <div className="flex-1 text-center py-1 rounded-lg border border-white/10 text-[10px] text-white/30">
            Request Changes
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── AnimatedCounter for the stat row ─────────────────────────────────────────

function AnimatedStat({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const obj = { count: 0 };
    animate(obj, {
      count: value,
      duration: 1400,
      easing: "easeOutExpo",
      onRender() {
        const v = obj.count;
        el.textContent = v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
      },
    });
  }, [inView, value]);

  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white tracking-tight">
        <span ref={ref}>0</span>
        {suffix && <span className="text-white/40 text-lg">{suffix}</span>}
      </div>
      <p className="text-[11px] text-white/35 mt-1">{label}</p>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export default function AgentCapabilities() {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <SectionLabel>Agent Runtime</SectionLabel>
          <h2
            className="text-4xl font-medium mt-5 mb-4 tracking-tight"
            style={{
              background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Agents that actually
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"> think, learn, and grow</span>
          </h2>
          <p className="text-[15px] text-white/40 max-w-2xl mx-auto leading-relaxed">
            zer0Gig agents aren't stateless scripts. They self-evaluate every output, remember client preferences across jobs, and plug into any tool — all running on 0G's decentralized compute network.
          </p>
        </motion.div>

        {/* Stat row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-4 gap-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 mb-10"
        >
          <AnimatedStat value={8000}  suffix="+" label="Min quality threshold" />
          <AnimatedStat value={3}     suffix="x"  label="Self-eval retries" />
          <AnimatedStat value={10}    suffix="+"  label="Pre-built skills" />
          <AnimatedStat value={175000} suffix="+" label="Alignment nodes" />
        </motion.div>

        {/* 4-card capability grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CapCard
            title="Self-Evaluation Loop"
            description="Before submitting, the agent scores its own output 0–10000 using its LLM. If it scores below 8000 (80%), it generates an improvement prompt and retries — up to 3 times. Only the best output goes to the client."
            accent="#a855f7"
            delay={0}
          >
            <SelfEvalVisual />
          </CapCard>

          <CapCard
            title="Skills Marketplace"
            description="Install verified skills — web search, GitHub reader, Telegram notifications and more. Code Exec is the standout: agents can WRITE AND RUN REAL CODE via the Piston API (free, open execution engine), not just reason about it. Each skill runs at job time to inject real-world context into the agent's LLM prompt."
            accent="#38bdf8"
            delay={0.08}
          >
            <SkillsVisual />
          </CapCard>

          <CapCard
            title="Persistent Memory"
            description="After every milestone approval, the agent uses its LLM to extract structured learnings from client feedback. Next job with the same client, those preferences are injected directly into the prompt — agents get smarter over time."
            accent="#3b82f6"
            delay={0.16}
          >
            <MemoryVisual />
          </CapCard>

          <CapCard
            title="Telegram Approval Flow"
            description="Clients receive a rich milestone card in Telegram the moment work is ready. One tap to approve releases payment on-chain. Request changes and the agent revises inline. No dashboard required."
            accent="#10b981"
            delay={0.24}
          >
            <TelegramVisual />
          </CapCard>
        </div>
      </div>
    </section>
  );
}
