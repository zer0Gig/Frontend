"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";

interface Dot {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  _animating: boolean;
}

interface Props {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  returnDuration?: number;
}

function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function throttle<T extends unknown[]>(fn: (...a: T) => void, ms: number) {
  let last = 0;
  return (...a: T) => {
    const now = performance.now();
    if (now - last >= ms) { last = now; fn(...a); }
  };
}

const MAX_CONCURRENT_TWEENS = 12;

export default function DotGrid({
  dotSize = 4,
  gap = 22,
  baseColor = "#243b6e",
  activeColor = "#38bdf8",
  proximity = 140,
  speedTrigger = 80,
  shockRadius = 240,
  shockStrength = 5,
  maxSpeed = 5000,
  returnDuration = 1.5,
}: Props) {
  // Respect prefers-reduced-motion — skip all animation if set
  const [reducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointer = useRef({ x: -9999, y: -9999, vx: 0, vy: 0, speed: 0, lastTime: 0, lastX: 0, lastY: 0 });
  const baseRgb = hexToRgb(baseColor);
  const activeRgb = hexToRgb(activeColor);

  // Build the dot grid whenever size changes
  const buildGrid = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    const cell = dotSize + gap;
    const cols = Math.floor((width + gap) / cell);
    const rows = Math.floor((height + gap) / cell);
    const startX = ((width - (cell * cols - gap)) / 2) + dotSize / 2;
    const startY = ((height - (cell * rows - gap)) / 2) + dotSize / 2;

    const dots: Dot[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({ cx: startX + c * cell, cy: startY + r * cell, xOffset: 0, yOffset: 0, _animating: false });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  // Debounced resize observer — rebuilds at most once per 200ms
  useEffect(() => {
    if (reducedMotion) return;
    buildGrid();
    let timer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(buildGrid, 200);
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => { ro.disconnect(); clearTimeout(timer); };
  }, [buildGrid, reducedMotion]);

  // Draw loop — pauses when tab is hidden
  useEffect(() => {
    if (reducedMotion) return;
    const proxSq = proximity * proximity;
    let raf: number;
    let running = true;

    const draw = () => {
      if (!running) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: px, y: py } = pointer.current;

      for (const dot of dotsRef.current) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        let fill = baseColor;
        if (dsq <= proxSq) {
          const t = 1 - Math.sqrt(dsq) / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          fill = `rgb(${r},${g},${b})`;
        }

        ctx.beginPath();
        ctx.arc(ox, oy, dotSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    draw();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reducedMotion, proximity, baseColor, baseRgb.r, baseRgb.g, baseRgb.b, activeRgb.r, activeRgb.g, activeRgb.b, dotSize]);

  // Mouse move + click — throttled at 150ms, capped at MAX_CONCURRENT_TWEENS
  useEffect(() => {
    if (reducedMotion) return;

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const pr = pointer.current;
      const dt = pr.lastTime ? now - pr.lastTime : 16;
      const dx = e.clientX - pr.lastX;
      const dy = e.clientY - pr.lastY;
      let vx = (dx / dt) * 1000;
      let vy = (dy / dt) * 1000;
      let speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) { const s = maxSpeed / speed; vx *= s; vy *= s; speed = maxSpeed; }
      pr.lastTime = now; pr.lastX = e.clientX; pr.lastY = e.clientY;
      pr.vx = vx; pr.vy = vy; pr.speed = speed;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;

      if (speed > speedTrigger) {
        // Skip if already at tween cap
        const activeTweens = dotsRef.current.filter(d => d._animating).length;
        if (activeTweens >= MAX_CONCURRENT_TWEENS) return;

        for (const dot of dotsRef.current) {
          if (dotsRef.current.filter(d => d._animating).length >= MAX_CONCURRENT_TWEENS) break;
          const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
          if (dist < proximity && !dot._animating) {
            dot._animating = true;
            gsap.killTweensOf(dot);
            const pushX = (dot.cx - pr.x) * 0.4 + vx * 0.006;
            const pushY = (dot.cy - pr.y) * 0.4 + vy * 0.006;
            gsap.to(dot, {
              xOffset: pushX, yOffset: pushY, duration: 0.4, ease: "power3.out",
              onComplete: () => {
                gsap.to(dot, {
                  xOffset: 0, yOffset: 0, duration: returnDuration,
                  ease: "elastic.out(1,0.75)",
                  onComplete: () => { dot._animating = false; },
                });
              },
            });
          }
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < shockRadius && !dot._animating) {
          dot._animating = true;
          gsap.killTweensOf(dot);
          const falloff = Math.max(0, 1 - dist / shockRadius);
          const pushX = (dot.cx - cx) * shockStrength * falloff;
          const pushY = (dot.cy - cy) * shockStrength * falloff;
          gsap.to(dot, {
            xOffset: pushX, yOffset: pushY, duration: 0.4, ease: "power3.out",
            onComplete: () => {
              gsap.to(dot, {
                xOffset: 0, yOffset: 0, duration: returnDuration,
                ease: "elastic.out(1,0.75)",
                onComplete: () => { dot._animating = false; },
              });
            },
          });
        }
      }
    };

    // 150ms throttle (was 40ms) — reduces CPU usage significantly
    const throttledMove = throttle(onMove, 150);
    window.addEventListener("mousemove", throttledMove, { passive: true });
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("mousemove", throttledMove);
      window.removeEventListener("click", onClick);
    };
  }, [reducedMotion, maxSpeed, speedTrigger, proximity, returnDuration, shockRadius, shockStrength]);

  // Reduced motion: render nothing (transparent placeholder)
  if (reducedMotion) {
    return <div style={{ width: "100%", height: "100%" }} />;
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={wrapRef} style={{ width: "100%", height: "100%", position: "relative" }}>
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
