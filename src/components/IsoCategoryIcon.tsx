"use client";

import { motion } from "framer-motion";

// ── Isometric Projection Math ───────────────────────────────────────────
const TILE_SCALE = 36;
const Z_SCALE = 24;

function iso(x: number, y: number, z: number) {
  return {
    sx: (x - y) * (TILE_SCALE * Math.cos(Math.PI / 6)),
    sy: (x + y) * (TILE_SCALE * Math.sin(Math.PI / 6)) - z * Z_SCALE,
  };
}

function pts(arr: number[]) {
  return arr.map((n) => n.toFixed(1)).join(",");
}

// Box: returns [topFace[], leftFace[], rightFace[]] as [x,y,z] triples
function boxFaces(
  cx: number,
  cy: number,
  w: number,
  d: number,
  h: number
): [number[][], number[][], number[][]] {
  const hw = w / 2;
  const hd = d / 2;
  // 8 corners: bottom(z=0) then top(z=h)
  const corners = [
    [-hw, -hd, 0],
    [hw, -hd, 0],
    [hw, hd, 0],
    [-hw, hd, 0],
    [-hw, -hd, h],
    [hw, -hd, h],
    [hw, hd, h],
    [-hw, hd, h],
  ].map(([px, py, pz]) => {
    const p = iso(cx + px, cy + py, pz);
    return [p.sx, p.sy];
  });

  const topFace = [corners[4], corners[5], corners[6], corners[7]];
  const leftFace = [corners[0], corners[3], corners[7], corners[4]];
  const rightFace = [corners[3], corners[2], corners[6], corners[7]];

  return [topFace, leftFace, rightFace];
}

// Cylinder: generate circle points, extrude to 3D
function cylinderFaces(
  cx: number,
  cy: number,
  r: number,
  h: number,
  segments = 16
): [number[][], number[][], number[][]] {
  const pts2D: [number, number][] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    pts2D.push([r * Math.cos(angle), r * Math.sin(angle)]);
  }

  const bottom = pts2D.map(([px, py]) => {
    const p = iso(cx + px / TILE_SCALE, cy + py / TILE_SCALE, 0);
    return [p.sx, p.sy];
  });
  const top = pts2D.map(([px, py]) => {
    const p = iso(cx + px / TILE_SCALE, cy + py / TILE_SCALE, h);
    return [p.sx, p.sy];
  });

  // For isometric: top face is the ellipse, left/right are the side arcs
  // Simplified: just show top face + a combined side
  const topFace = top;
  // Left side: left half of the cylinder
  const leftStart = Math.floor(segments * 0.25);
  const leftEnd = Math.floor(segments * 0.75);
  const leftSide: number[][] = [];
  for (let i = leftStart; i <= leftEnd; i++) {
    leftSide.push(bottom[i % segments]);
  }
  for (let i = leftEnd; i >= leftStart; i--) {
    leftSide.push(top[i % segments]);
  }

  // Right side: right half
  const rightStart = Math.floor(segments * 0.75);
  const rightEnd = Math.floor(segments * 1.25) % segments;
  const rightSide: number[][] = [];
  for (let i = rightStart; ; i = (i + 1) % segments) {
    rightSide.push(bottom[i]);
    if (i === rightEnd) break;
  }
  for (let i = rightEnd; ; i = (i - 1 + segments) % segments) {
    rightSide.push(top[i]);
    if (i === rightStart) break;
  }

  return [topFace, leftSide, rightSide];
}

// ── Category 3D Shapes ──────────────────────────────────────────────────

/**
 * Coding Agent — Keyboard/terminal: stacked rects with code lines
 */
function CodingShape({ color, accent }: { color: string; accent: string }) {
  const [top, left, right] = boxFaces(0, 0, 2.8, 2, 0.6);
  const [top2, left2, right2] = boxFaces(0, 0, 2.2, 1.6, 1.4);

  // Code lines on the screen
  const line1 = [iso(-0.6, 0, 1.8), iso(0.6, 0, 1.8)];
  const line2 = [iso(-0.6, 0, 2.1), iso(0.3, 0, 2.1)];
  const line3 = [iso(-0.6, 0, 2.4), iso(0.5, 0, 2.4)];

  return (
    <g>
      {/* Base (keyboard) */}
      <polygon points={pts(top.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.9" />
      <polygon points={pts(left.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.6" />
      <polygon points={pts(right.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.75" />

      {/* Screen */}
      <polygon points={pts(top2.flat())} fill="#0d1525" stroke={accent} strokeWidth="0.5" />
      <polygon points={pts(left2.flat())} fill="#0a0e1a" stroke={accent} strokeWidth="0.5" opacity="0.7" />
      <polygon points={pts(right2.flat())} fill="#0d1525" stroke={accent} strokeWidth="0.5" opacity="0.85" />

      {/* Code lines */}
      <line x1={line1[0].sx} y1={line1[0].sy} x2={line1[1].sx} y2={line1[1].sy} stroke={accent} strokeWidth="0.4" opacity="0.8" />
      <line x1={line2[0].sx} y1={line2[0].sy} x2={line2[1].sx} y2={line2[1].sy} stroke={accent} strokeWidth="0.4" opacity="0.5" />
      <line x1={line3[0].sx} y1={line3[0].sy} x2={line3[1].sx} y2={line3[1].sy} stroke={accent} strokeWidth="0.4" opacity="0.6" />
    </g>
  );
}

/**
 * Writing Agent — Document/scroll: cylinder with text lines
 */
function WritingShape({ color, accent }: { color: string; accent: string }) {
  const [top, left, right] = cylinderFaces(0, 0, 1.2, 2.4, 12);

  // Scroll lines
  const scrollLines = [-0.4, -0.1, 0.2, 0.5].map((z) => [
    iso(-0.5, 0, z),
    iso(0.5, 0, z),
  ]);

  return (
    <g>
      {/* Scroll body */}
      <polygon points={pts(left.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.6" />
      <polygon points={pts(right.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.75" />
      <polygon points={pts(top.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.9" />

      {/* Text lines */}
      {scrollLines.map((line, i) => (
        <line
          key={i}
          x1={line[0].sx}
          y1={line[0].sy}
          x2={line[1].sx}
          y2={line[1].sy}
          stroke={accent}
          strokeWidth="0.3"
          opacity={0.4 + i * 0.15}
        />
      ))}
    </g>
  );
}

/**
 * Data Analysis — Bar chart on a flat base
 */
function DataShape({ color, accent }: { color: string; accent: string }) {
  const [top, left, right] = boxFaces(0, 0, 2.4, 2.4, 0.4);

  // Bar heights (normalized 0-1)
  const bars = [
    { x: -0.7, y: -0.5, h: 1.2 },
    { x: -0.7, y: 0.5, h: 2.0 },
    { x: 0.3, y: -0.5, h: 0.8 },
    { x: 0.3, y: 0.5, h: 2.8 },
    { x: 1.0, y: 0, h: 1.6 },
  ];

  return (
    <g>
      {/* Base platform */}
      <polygon points={pts(top.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.9" />
      <polygon points={pts(left.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.6" />
      <polygon points={pts(right.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.75" />

      {/* Bars */}
      {bars.map((bar, i) => {
        const [bt, bl, br] = boxFaces(bar.x, bar.y, 0.4, 0.4, bar.h);
        return (
          <g key={i}>
            <polygon points={pts(bt.flat())} fill={accent} opacity="0.9" />
            <polygon points={pts(bl.flat())} fill={accent} opacity="0.5" />
            <polygon points={pts(br.flat())} fill={accent} opacity="0.7" />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Creative Agent — Color palette / paint drops
 */
function CreativeShape({ color, accent }: { color: string; accent: string }) {
  const [top, left, right] = boxFaces(0, 0, 2.2, 2.2, 0.5);

  // Floating color orbs
  const orbs = [
    { x: -0.6, y: -0.4, z: 1.2, r: 0.35 },
    { x: 0.5, y: -0.3, z: 1.8, r: 0.28 },
    { x: -0.2, y: 0.6, z: 1.5, r: 0.32 },
    { x: 0.6, y: 0.5, z: 2.2, r: 0.25 },
  ];

  return (
    <g>
      {/* Palette base */}
      <polygon points={pts(top.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.9" />
      <polygon points={pts(left.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.6" />
      <polygon points={pts(right.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.75" />

      {/* Floating orbs */}
      {orbs.map((orb, i) => {
        const p = iso(orb.x, orb.y, orb.z);
        const r = orb.r * TILE_SCALE * 0.7;
        return (
          <motion.circle
            key={i}
            cx={p.sx}
            cy={p.sy}
            r={r}
            fill={accent}
            opacity={0.3 + i * 0.15}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </g>
  );
}

/**
 * Research Agent — Magnifying glass over data points
 */
function ResearchShape({ color, accent }: { color: string; accent: string }) {
  const [top, left, right] = boxFaces(0, 0, 2.4, 2.4, 0.3);

  // Grid dots on surface
  const dots = [];
  for (let x = -1; x <= 1; x += 0.5) {
    for (let y = -1; y <= 1; y += 0.5) {
      dots.push({ x, y });
    }
    }

  // Magnifying glass ring
  const glass = iso(0.4, 0.4, 1.2);
  const glassR = 0.6 * TILE_SCALE;

  return (
    <g>
      {/* Base grid */}
      <polygon points={pts(top.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.9" />
      <polygon points={pts(left.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.6" />
      <polygon points={pts(right.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.75" />

      {/* Data dots */}
      {dots.map((dot, i) => {
        const p = iso(dot.x, dot.y, 0.5);
        return (
          <circle
            key={i}
            cx={p.sx}
            cy={p.sy}
            r="1.2"
            fill={accent}
            opacity={0.4 + (i % 3) * 0.2}
          />
        );
      })}

      {/* Magnifying glass */}
      <motion.circle
        cx={glass.sx}
        cy={glass.sy}
        r={glassR}
        fill="none"
        stroke={accent}
        strokeWidth="1.2"
        opacity="0.8"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {/* Glass handle */}
      <line
        x1={glass.sx + glassR * 0.7}
        y1={glass.sy + glassR * 0.7}
        x2={glass.sx + glassR * 1.4}
        y2={glass.sy + glassR * 1.4}
        stroke={accent}
        strokeWidth="1.5"
        opacity="0.6"
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * Code Execution — Lightning bolt / execution stack
 */
function ExecutionShape({ color, accent }: { color: string; accent: string }) {
  const [top, left, right] = boxFaces(0, 0, 2, 2, 0.5);

  // Lightning bolt points (centered on top face)
  const bolt = [
    iso(0.1, -0.2, 1.2),
    iso(-0.4, 0.3, 1.2),
    iso(0, 0.2, 1.2),
    iso(-0.2, 0.8, 1.2),
    iso(0.4, -0.1, 1.2),
    iso(0, 0, 1.2),
    iso(0.5, -0.5, 1.2),
  ];

  // Processing blocks
  const blocks = [
    boxFaces(-0.7, 0, 0.6, 0.6, 1.0),
    boxFaces(0.7, 0, 0.6, 0.6, 0.6),
  ];

  return (
    <g>
      {/* Base */}
      <polygon points={pts(top.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.9" />
      <polygon points={pts(left.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.6" />
      <polygon points={pts(right.flat())} fill={color} stroke={accent} strokeWidth="0.5" opacity="0.75" />

      {/* Processing blocks */}
      {blocks.map(([bt, bl, br], i) => (
        <g key={i}>
          <polygon points={pts(bt.flat())} fill={accent} opacity="0.4" />
          <polygon points={pts(bl.flat())} fill={accent} opacity="0.25" />
          <polygon points={pts(br.flat())} fill={accent} opacity="0.35" />
        </g>
      ))}

      {/* Lightning bolt */}
      <motion.polygon
        points={bolt.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ")}
        fill={accent}
        opacity="0.9"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </g>
  );
}

// ── Shape Registry ────────────────────────────────────────────────────────

const SHAPES: Record<string, React.FC<{ color: string; accent: string }>> = {
  solidityDev: CodingShape,
  codeExecution: ExecutionShape,
  contentWriting: WritingShape,
  dataAnalysis: DataShape,
  imageGeneration: CreativeShape,
  webSearch: ResearchShape,
};

// ── Main Component ────────────────────────────────────────────────────────

interface IsoCategoryIconProps {
  category: string;
  skillKey: string;
  size?: number;
}

export default function IsoCategoryIcon({ category, skillKey, size = 128 }: IsoCategoryIconProps) {
  const Shape = SHAPES[skillKey] || CodingShape;

  // Color palette per category (matches the AgentCategories card theme)
  const palette: Record<string, { base: string; accent: string }> = {
    solidityDev: { base: "#0e2a3a", accent: "#22d3ee" },
    codeExecution: { base: "#2a1a2a", accent: "#f43f5e" },
    contentWriting: { base: "#1a1a3a", accent: "#a855f7" },
    dataAnalysis: { base: "#0e2a1a", accent: "#10b981" },
    imageGeneration: { base: "#2a2a0e", accent: "#f59e0b" },
    webSearch: { base: "#0e1a3a", accent: "#3b82f6" },
  };

  const colors = palette[skillKey] || palette.solidityDev;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="-60 -60 120 120"
      className="overflow-visible"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle ambient glow */}
      <defs>
        <filter id={`glow-${skillKey}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#glow-${skillKey})`}>
        <Shape color={colors.base} accent={colors.accent} />
      </g>
    </motion.svg>
  );
}
