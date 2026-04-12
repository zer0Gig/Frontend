"use client";

/**
 * ScoreBadge — animated circular score ring.
 * Replaces raw "score/10000" text with a visual ring indicator.
 * Usage: <ScoreBadge score={8500} max={10000} size="sm" />
 */

import { useEffect, useRef } from "react";
import { animate } from "animejs";

type Size = "xs" | "sm" | "md" | "lg";

interface ScoreBadgeProps {
  score: number;
  max?: number;
  size?: Size;
  showLabel?: boolean;
  className?: string;
}

const sizes: Record<Size, { r: number; sw: number; fontSize: string; dim: number }> = {
  xs: { r: 14, sw: 2.5, fontSize: "text-[9px]",  dim: 36 },
  sm: { r: 18, sw: 3,   fontSize: "text-[10px]", dim: 44 },
  md: { r: 26, sw: 4,   fontSize: "text-[12px]", dim: 64 },
  lg: { r: 36, sw: 5,   fontSize: "text-[15px]", dim: 88 },
};

function scoreColor(pct: number): string {
  if (pct >= 0.9) return "#10b981"; // emerald
  if (pct >= 0.8) return "#38bdf8"; // sky
  if (pct >= 0.7) return "#f59e0b"; // amber
  return "#f87171";                  // red
}

export function ScoreBadge({ score, max = 10000, size = "sm", showLabel = true, className = "" }: ScoreBadgeProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const cfg       = sizes[size];
  const pct       = Math.min(1, Math.max(0, score / max));
  const color     = scoreColor(pct);
  const circ      = 2 * Math.PI * cfg.r;
  const cx        = cfg.dim / 2;

  useEffect(() => {
    if (!circleRef.current) return;
    // Start from full gap (empty ring), animate to target
    circleRef.current.style.strokeDashoffset = String(circ);
    animate(circleRef.current, {
      strokeDashoffset: [circ, circ * (1 - pct)],
      duration: 900,
      easing: "easeOutCubic",
    });
  }, [score, circ, pct]);

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
         style={{ width: cfg.dim, height: cfg.dim }}>
      <svg width={cfg.dim} height={cfg.dim} viewBox={`0 0 ${cfg.dim} ${cfg.dim}`} className="-rotate-90">
        {/* Track */}
        <circle cx={cx} cy={cx} r={cfg.r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={cfg.sw} />
        {/* Progress */}
        <circle
          ref={circleRef}
          cx={cx} cy={cx} r={cfg.r}
          fill="none"
          stroke={color}
          strokeWidth={cfg.sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ}
          style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
        />
      </svg>
      {/* Label */}
      {showLabel && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${cfg.fontSize}`}>
          <span className="font-semibold" style={{ color }}>{Math.round(pct * 100)}</span>
          <span className="text-white/30" style={{ fontSize: "0.7em" }}>/ 100</span>
        </div>
      )}
    </div>
  );
}

/** Inline bar variant — for table rows / compact lists */
export function ScoreBar({ score, max = 10000, className = "" }: { score: number; max?: number; className?: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct    = Math.min(1, Math.max(0, score / max));
  const color  = scoreColor(pct);

  useEffect(() => {
    if (!barRef.current) return;
    animate(barRef.current, {
      width: [`0%`, `${pct * 100}%`],
      duration: 700,
      easing: "easeOutCubic",
    });
  }, [score, pct]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div ref={barRef} className="h-full rounded-full" style={{ backgroundColor: color, width: 0, boxShadow: `0 0 6px ${color}66` }} />
      </div>
      <span className="text-[11px] font-medium flex-shrink-0" style={{ color }}>
        {Math.round(pct * 100)}
        <span className="text-white/30 font-normal">/100</span>
      </span>
    </div>
  );
}
