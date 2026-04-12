"use client";

/**
 * SkillBadge — reusable skill/capability pill.
 * Used across agent cards, memory panel, job stream, etc.
 * No emojis — uses category-colored SVG rings + text.
 */

import React from "react";

interface SkillBadgeProps {
  id: string;
  name?: string;
  category?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  data:          { bg: "bg-sky-500/10",     border: "border-sky-500/25",     text: "text-sky-300",     dot: "#38bdf8" },
  code:          { bg: "bg-violet-500/10",  border: "border-violet-500/25",  text: "text-violet-300",  dot: "#a855f7" },
  communication: { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-300", dot: "#10b981" },
  media:         { bg: "bg-pink-500/10",    border: "border-pink-500/25",    text: "text-pink-300",    dot: "#ec4899" },
  storage:       { bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-300",   dot: "#f59e0b" },
  default:       { bg: "bg-white/[0.05]",   border: "border-white/10",       text: "text-white/50",    dot: "#ffffff44" },
};

const SKILL_LABELS: Record<string, { name: string; category: string }> = {
  web_search:      { name: "Web Search",      category: "data" },
  http_fetch:      { name: "HTTP Fetch",       category: "data" },
  github_reader:   { name: "GitHub Reader",    category: "code" },
  code_exec:       { name: "Code Executor",    category: "code" },
  csv_analyst:     { name: "CSV Analyst",      category: "data" },
  pdf_reader:      { name: "PDF Reader",       category: "media" },
  image_gen:       { name: "Image Gen",        category: "media" },
  telegram_notify: { name: "Telegram",         category: "communication" },
  whatsapp_notify: { name: "WhatsApp",         category: "communication" },
  sql_query:       { name: "SQL Query",        category: "storage" },
};

const sizeMap = {
  xs: "px-1.5 py-0.5 text-[9px] gap-1",
  sm: "px-2 py-1 text-[11px] gap-1.5",
  md: "px-3 py-1.5 text-[12px] gap-2",
};

export function SkillBadge({ id, name, category, size = "sm", className = "" }: SkillBadgeProps) {
  const meta   = SKILL_LABELS[id] || {};
  const label  = name || meta.name || id;
  const cat    = category || meta.category || "default";
  const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeMap[size]} ${colors.bg} ${colors.border} ${colors.text} ${className}`}
    >
      <span
        className="rounded-full flex-shrink-0"
        style={{ width: size === "xs" ? 5 : 6, height: size === "xs" ? 5 : 6, backgroundColor: colors.dot }}
      />
      {label}
    </span>
  );
}

/** A group of skill badges with a +N overflow indicator */
export function SkillBadgeGroup({
  skillIds,
  max = 4,
  size = "sm",
  className = "",
}: {
  skillIds: string[];
  max?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const visible  = skillIds.slice(0, max);
  const overflow = skillIds.length - max;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {visible.map(id => <SkillBadge key={id} id={id} size={size} />)}
      {overflow > 0 && (
        <span className={`inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] text-white/30 font-medium ${sizeMap[size]}`}>
          +{overflow}
        </span>
      )}
    </div>
  );
}
