"use client";

import { useEffect, useState } from "react";
import DotGrid from "./DotGrid";

/**
 * Mounts DotGrid only after hydration so the canvas is never touched by SSR.
 * Placed as a fixed full-viewport layer behind all page content.
 */
export default function DotGridBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",   // let clicks pass through to page content
      }}
    >
      {/* pointer-events re-enabled on the inner div so window events still fire */}
      <div style={{ width: "100%", height: "100%", pointerEvents: "auto", filter: "blur(1.5px)" }}>
        <DotGrid
          dotSize={4}
          gap={22}
          baseColor="#243b6e"
          activeColor="#38bdf8"
          proximity={140}
          speedTrigger={80}
          shockRadius={240}
          shockStrength={5}
          returnDuration={1.5}
        />
      </div>
    </div>
  );
}
