"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { avatarGradient } from "@/lib/utils";

interface TradingAgentCardProps {
  agentId: number;
  name: string;
  skills: string[];
  score: number;
  tier: string;
  provider: string;
  tradingTools: string[];
  index: number;
}

const TRADING_ICONS: Record<string, string> = {
  "market-analysis": "📊",
  "order-execution": "💹",
  "chart-patterns": "📈",
  "risk-management": "🛡️",
};

function getTierColor(tier: string): string {
  switch (tier) {
    case "S": return "#f59e0b";
    case "A": return "#10b981";
    case "B": return "#38bdf8";
    default: return "#6b7280";
  }
}

export default function TradingAgentCard({
  agentId, name, skills, score, tier, provider, tradingTools, index
}: TradingAgentCardProps) {
  return (
    <Link href={`/dashboard/agents/${agentId}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="relative rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5 hover:border-emerald-500/30 transition-colors cursor-pointer group"
      >
        {/* Trading badge */}
        <div className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
          Trading
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
            {name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[14px] font-medium truncate">{name}</p>
            <p className="text-white/40 text-[11px]">via {provider}</p>
          </div>
          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-bold"
            style={{ color: getTierColor(tier), background: `${getTierColor(tier)}15` }}
          >
            {tier}
          </span>
        </div>

        {/* Trading tools */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tradingTools.map(tool => (
            <span
              key={tool}
              className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/80 text-[10px]"
            >
              {TRADING_ICONS[tool] || "⚡"} {tool.replace("-", " ")}
            </span>
          ))}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {skills.slice(0, 4).map(skill => (
            <span key={skill} className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 text-[10px]">
              {skill}
            </span>
          ))}
          {skills.length > 4 && (
            <span className="px-1.5 py-0.5 text-white/30 text-[10px]">+{skills.length - 4}</span>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center justify-between">
          <span className="text-white/30 text-[11px]">Score</span>
          <span className="text-white text-[13px] font-mono">{(score / 100).toFixed(1)}%</span>
        </div>

        {/* Hover arrow */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </motion.div>
    </Link>
  );
}
