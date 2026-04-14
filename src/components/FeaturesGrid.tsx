"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ShinyText from "./ShinyText/ShinyText";
import { BorderBeam } from "./ui/BorderBeam";

// ── Mini isometric math for card visualizations ─────────────────
const T = 18, Z = 12;
function iso(x: number, y: number, z: number) {
  return { sx: (x - y) * Math.cos(Math.PI / 6) * T, sy: (x + y) * Math.sin(Math.PI / 6) * T - z * Z };
}
interface Pt { x: number; y: number }
function mkCircle(ox: number, oy: number, r: number, n = 24): Pt[] {
  return Array.from({ length: n }, (_, i) => ({ x: ox + r * Math.cos(2 * Math.PI * i / n), y: oy + r * Math.sin(2 * Math.PI * i / n) }));
}
function mkGear(ox: number, oy: number, ri: number, ro: number, teeth: number): Pt[] {
  const pts: Pt[] = [];
  const s = Math.PI / teeth;
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? ro : ri;
    pts.push({ x: ox + r * Math.cos(i * s - s * 0.35), y: oy + r * Math.sin(i * s - s * 0.35) });
    pts.push({ x: ox + r * Math.cos(i * s + s * 0.35), y: oy + r * Math.sin(i * s + s * 0.35) });
  }
  return pts;
}
function mkRect(ox: number, oy: number, w: number, h: number): Pt[] {
  return [{ x: ox - w / 2, y: oy - h / 2 }, { x: ox + w / 2, y: oy - h / 2 }, { x: ox + w / 2, y: oy + h / 2 }, { x: ox - w / 2, y: oy + h / 2 }];
}
function mkPoly(ox: number, oy: number, r: number, sides: number): Pt[] { return mkCircle(ox, oy, r, sides); }

function Ext({ cx, cy, pts, z, h, color, glow }: { cx: number; cy: number; pts: Pt[]; z: number; h: number; color: string; glow?: boolean }) {
  const bot = pts.map(p => { const i = iso(p.x, p.y, z); return { sx: cx + i.sx, sy: cy + i.sy }; });
  const top = pts.map(p => { const i = iso(p.x, p.y, z + h); return { sx: cx + i.sx, sy: cy + i.sy }; });
  const faces: { d: number; s: string }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const n = (i + 1) % pts.length;
    faces.push({ d: (pts[i].x + pts[n].x) / 2 + (pts[i].y + pts[n].y) / 2, s: [bot[i], bot[n], top[n], top[i]].map(p => `${p.sx},${p.sy}`).join(" ") });
  }
  faces.sort((a, b) => a.d - b.d);
  const tp = top.map(p => `${p.sx},${p.sy}`).join(" ");
  return (
    <g>
      {faces.map((f, i) => <polygon key={i} points={f.s} fill={color} fillOpacity={0.15} stroke={color} strokeWidth="0.5" strokeOpacity={0.4} strokeLinejoin="round" />)}
      <polygon points={tp} fill={color} fillOpacity={0.25} stroke={color} strokeWidth="0.7" strokeOpacity={0.6} strokeLinejoin="round"
        filter={glow ? `drop-shadow(0 0 8px ${color}66)` : "none"} />
    </g>
  );
}

// ── CSS animation styles ────────────────────────────────────────
const animStyles = `
@keyframes cardFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
@keyframes cardFloatFast { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
@keyframes cardPiston { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
@keyframes cardSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes cardPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.9; } }
.float-s { animation: cardFloat 3s ease-in-out infinite; }
.float-f { animation: cardFloatFast 1.8s ease-in-out infinite; }
.piston-a { animation: cardPiston 1.2s ease-in-out infinite; }
.pulse-a { animation: cardPulse 2s ease-in-out infinite; }

/* Snake patrol — CSS lines through grid gutters only */
.snake-grid-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.snake-grid-lines::before {
  content: '';
  position: absolute;
  inset: 0;
  /* Horizontal lines at gutter positions (between rows) */
  background:
    linear-gradient(90deg, rgba(56, 189, 248, 0.25) 0%, rgba(168, 85, 247, 0.25) 50%, rgba(34, 211, 238, 0.25) 100%) 0 33.33% / 100% 1px no-repeat,
    linear-gradient(90deg, rgba(34, 211, 238, 0.25) 0%, rgba(56, 189, 248, 0.25) 50%, rgba(168, 85, 247, 0.25) 100%) 0 66.67% / 100% 1px no-repeat;
  animation: snakeFadeH 8s ease-in-out infinite;
}
.snake-grid-lines::after {
  content: '';
  position: absolute;
  inset: 0;
  /* Vertical lines at gutter positions (between columns) */
  background:
    linear-gradient(180deg, rgba(168, 85, 247, 0.25) 0%, rgba(56, 189, 248, 0.25) 50%, rgba(34, 211, 238, 0.25) 100%) 33.33% 0 / 1px 100% no-repeat,
    linear-gradient(180deg, rgba(56, 189, 248, 0.25) 0%, rgba(34, 211, 238, 0.25) 50%, rgba(168, 85, 247, 0.25) 100%) 66.67% 0 / 1px 100% no-repeat;
  animation: snakeFadeV 8s ease-in-out infinite;
}
@keyframes snakeFadeH {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}
@keyframes snakeFadeV {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}
`;

// ── Feature data with unique 3D renders ─────────────────────────
const features = [
  {
    title: "Progressive Escrow",
    description: "Milestone-based payment. Funds only release when quality is verified on-chain by the alignment network.",
    accent: "#38bdf8",
    deep: "#0a1e30",
    pattern: "dots",
    render: (cx: number, cy: number) => (
      <g>
        {/* Vault base */}
        <Ext cx={cx} cy={cy} pts={mkRect(0, 0, 7, 7)} z={0} h={0.6} color="#38bdf8" />
        {/* Milestone layers (stacked) */}
        <g className="float-s">{[0, 1, 2].map(i => <Ext key={i} cx={cx} cy={cy} pts={mkRect(0, 0, 5 - i * 0.8, 5 - i * 0.8)} z={1 + i * 1.4} h={1} color="#38bdf8" glow={i === 2} />)}</g>
        {/* Lock cylinder on top */}
        <g className="float-f"><Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 1, 12)} z={5.5} h={1.2} color="#38bdf8" glow /></g>
      </g>
    ),
  },
  {
    title: "Agent ID (ERC-721)",
    description: "Every AI agent has an on-chain identity with immutable portfolio, reputation score, and job history.",
    accent: "#a855f7",
    deep: "#140a28",
    pattern: "grid",
    render: (cx: number, cy: number) => {
      const sats = mkCircle(0, 0, 3.5, 5).sort((a, b) => (a.x + a.y) - (b.x + b.y));
      return (
        <g>
          {/* NFT token base */}
          <Ext cx={cx} cy={cy} pts={mkPoly(0, 0, 4, 6)} z={0} h={0.5} color="#a855f7" />
          {/* Identity pillar */}
          <Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 2, 24)} z={0.5} h={3} color="#a855f7" />
          {/* Orbiting identity nodes */}
          <g className="float-s">{sats.map((s, i) => <Ext key={i} cx={cx} cy={cy} pts={mkCircle(s.x, s.y, 0.5, 8)} z={1.5 + i * 0.3} h={0.8} color="#a855f7" glow />)}</g>
          {/* Crown */}
          <g className="float-f"><Ext cx={cx} cy={cy} pts={mkPoly(0, 0, 1.5, 6)} z={3.8} h={0.8} color="#a855f7" glow /></g>
        </g>
      );
    },
  },
  {
    title: "0G AI Alignment Nodes",
    description: "175,000+ decentralized nodes evaluate output quality as a neutral arbiter — no single point of failure.",
    accent: "#16a34a",
    deep: "#040e08",
    pattern: "cross",
    render: (cx: number, cy: number) => {
      const nodes = mkCircle(0, 0, 3.5, 8).sort((a, b) => (a.x + a.y) - (b.x + b.y));
      return (
        <g>
          {/* Central hub */}
          <Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 1.8, 16)} z={0} h={2.5} color="#22c55e" />
          {/* Verification ring */}
          <Ext cx={cx} cy={cy} pts={mkGear(0, 0, 2.5, 3.2, 10)} z={2.5} h={0.4} color="#22c55e" glow />
          {/* Distributed nodes */}
          {nodes.map((n, i) => (
            <g key={i} className={i % 2 === 0 ? "float-s" : "float-f"}>
              <Ext cx={cx} cy={cy} pts={mkCircle(n.x, n.y, 0.6, 8)} z={0.5 + (i % 3) * 0.5} h={1.5} color="#22c55e" glow={i === 3} />
            </g>
          ))}
        </g>
      );
    },
  },
  {
    title: "x402 Micropayments",
    description: "Machine-to-machine payments. AI pays AI autonomously via HTTP 402 protocol — zero human friction.",
    accent: "#f59e0b",
    deep: "#1e1608",
    pattern: "diag",
    render: (cx: number, cy: number) => (
      <g>
        {/* Power base */}
        <Ext cx={cx} cy={cy} pts={mkRect(0, 0, 7, 2.5)} z={0} h={1} color="#f59e0b" />
        <Ext cx={cx} cy={cy} pts={mkRect(0, 0, 2.5, 7)} z={0} h={1} color="#f59e0b" />
        {/* Core block */}
        <Ext cx={cx} cy={cy} pts={mkRect(0, 0, 3.5, 3.5)} z={1} h={1.5} color="#f59e0b" />
        {/* Piston */}
        <g className="piston-a"><Ext cx={cx} cy={cy} pts={mkRect(0, 0, 2, 2)} z={2.5} h={2.5} color="#f59e0b" glow /></g>
        {/* Lightning tip */}
        <g className="float-f"><Ext cx={cx} cy={cy} pts={mkPoly(0, 0, 0.8, 3)} z={5.5} h={1} color="#f59e0b" glow /></g>
      </g>
    ),
  },
  {
    title: "0G Storage",
    description: "Permanent agent portfolio on decentralized storage. 95% cheaper than AWS S3, censorship-resistant.",
    accent: "#0891b2",
    deep: "#030d12",
    pattern: "lines",
    render: (cx: number, cy: number) => (
      <g>
        {/* Drum base */}
        <Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 4, 32)} z={0} h={0.6} color="#06b6d4" />
        {/* Data platters (stacked discs) */}
        {[0, 1, 2, 3].map(i => (
          <g key={i} className={i % 2 === 0 ? "float-s" : ""}>
            <Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 3.5 - i * 0.2, 24)} z={1 + i * 1.2} h={0.7} color="#06b6d4" glow={i === 3} />
          </g>
        ))}
        {/* Read head */}
        <g className="float-f"><Ext cx={cx} cy={cy} pts={mkRect(0, -2, 1, 4)} z={4.5} h={0.4} color="#06b6d4" glow /></g>
      </g>
    ),
  },
  {
    title: "Sealed Inference (TEE)",
    description: "Client data stays encrypted end-to-end. Even node operators can't see your prompts or model outputs.",
    accent: "#be185d",
    deep: "#100310",
    pattern: "hex",
    render: (cx: number, cy: number) => (
      <g>
        <Ext cx={cx} cy={cy} pts={mkPoly(0, 0, 4.5, 6)} z={0} h={0.3} color="#ec4899" />
        <Ext cx={cx} cy={cy} pts={mkPoly(0, 0, 3.5, 6)} z={0.5} h={1.5} color="#ec4899" />
        <g className="float-s"><Ext cx={cx} cy={cy} pts={mkPoly(0, 0, 2.5, 6)} z={2.2} h={1.2} color="#ec4899" /></g>
        <g className="float-f"><Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 1.2, 12)} z={3.8} h={1.5} color="#ec4899" glow /></g>
        <Ext cx={cx} cy={cy} pts={mkGear(0, 0, 1, 1.6, 6)} z={5.5} h={0.3} color="#ec4899" glow />
      </g>
    ),
  },
  // ── New: Agent Runtime features ────────────────────────────────
  {
    title: "Self-Evaluation Loop",
    description: "Agent scores its own output 0–10000 before submission. Retries with an improvement prompt if below 80% — up to 3 rounds of autonomous refinement.",
    accent: "#a855f7",
    deep: "#150a28",
    pattern: "circuit",
    render: (cx: number, cy: number) => {
      const ring = mkCircle(0, 0, 3.5, 6).sort((a, b) => (a.x + a.y) - (b.x + b.y));
      return (
        <g>
          {/* Score ring base */}
          <Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 4, 32)} z={0} h={0.4} color="#a855f7" />
          {/* Score fill layers (represents % filled) */}
          {[0, 1, 2].map(i => (
            <g key={i} className={i === 2 ? "float-f" : "float-s"}>
              <Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 3 - i * 0.5, 32)} z={0.6 + i * 1.2} h={0.9} color="#a855f7" glow={i === 2} />
            </g>
          ))}
          {/* Evaluation nodes around the ring */}
          {ring.map((n, i) => (
            <g key={i} className={i % 2 === 0 ? "float-s" : "float-f"}>
              <Ext cx={cx} cy={cy} pts={mkCircle(n.x, n.y, 0.45, 6)} z={1 + (i % 3) * 0.4} h={0.8} color="#a855f7" glow={i === 1} />
            </g>
          ))}
        </g>
      );
    },
  },
  {
    title: "Skills Registry",
    description: "Install pre-built tools from the platform catalog. Web search, GitHub reader, code execution, Telegram — each skill injects live context into the agent's LLM at runtime.",
    accent: "#22d3ee",
    deep: "#041820",
    pattern: "cross",
    render: (cx: number, cy: number) => {
      const slots = [
        { x: -3, y: -2 }, { x: 0, y: -3.5 }, { x: 3, y: -2 },
        { x: -3, y: 2  }, { x: 0, y: 3.5  }, { x: 3, y: 2  },
      ];
      return (
        <g>
          {/* Central hub */}
          <Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 1.8, 16)} z={0} h={2.2} color="#22d3ee" />
          {/* Skill slots arranged around hub */}
          {slots.map((s, i) => (
            <g key={i} className={i % 2 === 0 ? "float-s" : "float-f"}>
              <Ext cx={cx} cy={cy} pts={mkRect(s.x, s.y, 1.6, 1.6)} z={0.5 + (i % 3) * 0.4} h={1.4} color="#22d3ee" glow={i === 2} />
            </g>
          ))}
          {/* Connector ring */}
          <Ext cx={cx} cy={cy} pts={mkGear(0, 0, 2.2, 2.8, 6)} z={2.3} h={0.3} color="#22d3ee" glow />
        </g>
      );
    },
  },
  {
    title: "Persistent Memory",
    description: "After every approved milestone, the agent extracts structured learnings from client feedback and stores them in Supabase. Future jobs with the same client inject those preferences directly.",
    accent: "#3b82f6",
    deep: "#060e1f",
    pattern: "grid",
    render: (cx: number, cy: number) => {
      const memRows = [-2.5, -0.5, 1.5, 3.5];
      return (
        <g>
          {/* Memory stack base */}
          <Ext cx={cx} cy={cy} pts={mkRect(0, 0, 8, 2)} z={0} h={0.5} color="#3b82f6" />
          {/* Memory rows (stacked records) */}
          {memRows.map((y, i) => (
            <g key={i} className={i % 2 === 0 ? "float-s" : ""}>
              <Ext cx={cx} cy={cy} pts={mkRect(-1.5, y, 4, 1.2)} z={0.8 + i * 0.9} h={0.7} color="#3b82f6" glow={i === 3} />
              <Ext cx={cx} cy={cy} pts={mkRect(2.8, y, 1.5, 1.2)} z={0.8 + i * 0.9} h={0.7} color="#3b82f6" />
            </g>
          ))}
          {/* Read/write head */}
          <g className="float-f">
            <Ext cx={cx} cy={cy} pts={mkRect(0, 0, 1, 0.5)} z={5} h={1.8} color="#3b82f6" glow />
          </g>
        </g>
      );
    },
  },
];

// ── SVG pattern defs ────────────────────────────────────────────
function PatternDefs() {
  return (
    <svg width="0" height="0" className="absolute">
      <defs>
        <pattern id="p-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="white" />
        </pattern>
        <pattern id="p-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
        <pattern id="p-cross" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 12 8 L 12 16 M 8 12 L 16 12" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
        <pattern id="p-diag" x="0" y="0" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <path d="M 0 5 L 10 5" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
        <pattern id="p-lines" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 0 5 L 10 5" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
        <pattern id="p-hex" x="0" y="0" width="28" height="48" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
          <path d="M14 0l14 8v16l-14 8L0 24V8z M14 48l14-8V24l-14-8L0 24v16z" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
        <pattern id="p-circuit" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M8 0v8h16V0M8 32v-8h16V32M0 8h8M24 8h8M0 24h8M24 24h8" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="8" cy="8" r="1.5" fill="white" fillOpacity="0.4"/><circle cx="24" cy="8" r="1.5" fill="white" fillOpacity="0.4"/>
          <circle cx="8" cy="24" r="1.5" fill="white" fillOpacity="0.4"/><circle cx="24" cy="24" r="1.5" fill="white" fillOpacity="0.4"/>
        </pattern>
      </defs>
    </svg>
  );
}

// ─── Snake Patrol Line Component ──────────────────────────────────────
// A single subtle glowing line that snakes through the grid gutters,
// matching the dark minimal aesthetic. No head dot — pure CSS animation.

function SnakePatrolLine() {
  const lineRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);

  // Path traces the grid gutters in a continuous serpentine loop.
  // For a 3×3 grid, gutters sit at 33.33% and 66.67%.
  function generatePatrolPath(): string {
    const g1 = 33.33;
    const g2 = 66.67;

    // Continuous loop: weaves through all gutter intersections
    const pts: [number, number][] = [
      [0, g1], [g1, g1], [g1, 0],
      [g2, 0], [g2, g1], [100, g1],
      [100, g2], [g2, g2], [g2, 100],
      [g1, 100], [g1, g2], [0, g2],
      [0, g1],
    ];

    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const dx = curr[0] - prev[0];
      const dy = curr[1] - prev[1];
      d += ` C ${prev[0] + dx * 0.35} ${prev[1] + dy * 0.35}, ${prev[0] + dx * 0.65} ${prev[1] + dy * 0.65}, ${curr[0]} ${curr[1]}`;
    }
    return d;
  }

  useEffect(() => {
    const pathEl = lineRef.current;
    const glowEl = glowRef.current;
    if (!pathEl) return;

    const pathLength = pathEl.getTotalLength();
    pathEl.style.setProperty('--pl', String(pathLength));
    if (glowEl) glowEl.style.setProperty('--pl', String(pathLength));
  }, []);

  const patrolPath = generatePatrolPath();

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none -z-10"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      {/* Soft outer glow */}
      <path
        ref={glowRef}
        d={patrolPath}
        className="snake-glow"
        stroke="rgba(255, 255, 255, 0.06)"
        strokeWidth="2"
        opacity="0.5"
      />
      {/* Core line */}
      <path
        ref={lineRef}
        d={patrolPath}
        className="snake-line"
        stroke="rgba(56, 189, 248, 0.25)"
        strokeWidth="0.6"
        opacity="0.8"
      />
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────────
export default function FeaturesGrid() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: animStyles }} />
      <PatternDefs />

      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-500/[0.06] blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/60">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="4" height="4" rx="1" /><rect x="8" y="2" width="4" height="4" rx="1" />
              <rect x="2" y="8" width="4" height="4" rx="1" /><rect x="8" y="8" width="4" height="4" rx="1" />
            </svg>
            <ShinyText text="Core Technology" speed={2.5} color="rgba(255,255,255,0.4)" shineColor="rgba(255,255,255,0.9)" spread={100} />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-5xl font-medium text-center mb-16"
          style={{ background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Built on the 0G Stack — from infra to intelligence
        </motion.h2>

        {/* Grid with Snake Patrol overlay */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="card-grid">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.21, 1.11, 0.81, 0.99] }}
              className="group relative overflow-hidden rounded-2xl cursor-pointer z-10"
              style={{
                background: f.deep,
                border: `1px solid ${f.accent}15`,
                transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s, box-shadow 0.3s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                (e.currentTarget as HTMLElement).style.borderColor = `${f.accent}50`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 50px -10px ${f.accent}20, 0 0 0 1px ${f.accent}30`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.borderColor = `${f.accent}15`;
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {/* BorderBeam — only visible on hover via group */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <BorderBeam
                  colorFrom={f.accent}
                  colorTo={`${f.accent}40`}
                  duration={8}
                  size={150}
                  borderWidth={1}
                  delay={i * 0.3}
                />
              </div>

              {/* Background pattern texture */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <svg width="100%" height="100%"><rect width="100%" height="100%" fill={`url(#p-${f.pattern})`} /></svg>
              </div>

              {/* 3D Isometric Visualization */}
              <div className="relative h-[200px] flex items-center justify-center pointer-events-none overflow-hidden">
                <svg viewBox="0 0 300 250" className="w-full h-full overflow-visible">
                  {f.render(150, 140)}
                </svg>
                {/* Radial glow behind shape */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: `radial-gradient(circle at 50% 60%, ${f.accent}12 0%, transparent 65%)`,
                }} />
              </div>

              {/* Text content */}
              <div className="relative px-6 pb-6 pt-0">
                {/* Accent line */}
                <div className="w-8 h-[2px] rounded-full mb-4" style={{ background: f.accent, boxShadow: `0 0 8px ${f.accent}` }} />

                <h3 className="text-[16px] font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[13px] text-white/45 leading-relaxed">{f.description}</p>
              </div>

              {/* Stat badge top-right */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full pulse-a" style={{ background: f.accent }} />
                <span className="text-[9px] font-mono tracking-[0.15em] uppercase" style={{ color: `${f.accent}80` }}>ACTIVE</span>
              </div>
            </motion.div>
          ))}
          </div>

          {/* Snake Patrol SVG Overlay — single animated line patrolling the grid */}
          <SnakePatrolLine />
        </div>
      </div>
    </section>
  );
}
