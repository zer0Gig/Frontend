"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { animate } from "animejs";

const GRADIENTS = [
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-500",
];

const PROVIDER_LABELS: Record<string, string> = {
  "0g_compute": "0G Compute",
  openai: "OpenAI",
  anthropic: "Anthropic",
  groq: "Groq",
  openrouter: "OpenRouter",
  alibaba: "Alibaba",
  google: "Google",
};

interface Props {
  displayName: string;
  bio: string;
  avatarUrl: string;
  selectedSkillLabels: string[];
  defaultRateOG: string;
  runtimeType: "self_hosted" | "platform_managed";
  llmProvider: string;
  ownerAddress: string;
}

export default function RegisterPreviewCard({
  displayName,
  bio,
  avatarUrl,
  selectedSkillLabels,
  defaultRateOG,
  runtimeType,
  llmProvider,
  ownerAddress,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const bioRef = useRef<HTMLDivElement>(null);
  const rateRef = useRef<HTMLSpanElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const prevName = useRef(displayName);
  const prevBio = useRef(bio);
  const prevRate = useRef(defaultRateOG);
  const prevAvatar = useRef(avatarUrl);

  // ── Card entrance ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!cardRef.current) return;
    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [32, 0],
      duration: 700,
      ease: "outExpo",
      delay: 350,
    });
  }, []);

  // ── Repeating shine sweep ─────────────────────────────────────────────────

  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>;
    const sweep = () => {
      if (!shineRef.current) return;
      animate(shineRef.current, {
        translateX: ["-180%", "280%"],
        duration: 1000,
        ease: "inOutQuad",
      });
      tid = setTimeout(sweep, 5000);
    };
    tid = setTimeout(sweep, 2000);
    return () => clearTimeout(tid);
  }, []);

  // ── Name pulse ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!nameRef.current || displayName === prevName.current) return;
    prevName.current = displayName;
    animate(nameRef.current, {
      scale: [1, 1.06, 1],
      duration: 350,
      ease: "outElastic",
    });
  }, [displayName]);

  // ── Avatar pop-in ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!avatarRef.current || !avatarUrl || avatarUrl === prevAvatar.current)
      return;
    prevAvatar.current = avatarUrl;
    animate(avatarRef.current, {
      scale: [0.7, 1.08, 1],
      opacity: [0, 1],
      duration: 380,
      ease: "outElastic",
    });
  }, [avatarUrl]);

  // ── Bio slide-in ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!bioRef.current) return;
    if (bio && !prevBio.current) {
      animate(bioRef.current, {
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 300,
        ease: "outQuart",
      });
    }
    prevBio.current = bio;
  }, [bio]);

  // ── Rate flash ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!rateRef.current || defaultRateOG === prevRate.current) return;
    prevRate.current = defaultRateOG;
    animate(rateRef.current, {
      color: ["#38bdf8", "#ffffff"],
      duration: 700,
      ease: "outQuart",
    });
  }, [defaultRateOG]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const gradient = GRADIENTS[0];
  const name = displayName || "Your Agent Name";
  const shortAddr = ownerAddress
    ? `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`
    : "0x0000...0000";
  const rateLabel = defaultRateOG ? `${defaultRateOG} OG` : "— OG";
  const provLabel = PROVIDER_LABELS[llmProvider] ?? llmProvider;

  return (
    <div
      className="sticky top-28 select-none"
      style={{ opacity: 0 }}
      ref={cardRef}
    >
      {/* Label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
        <p className="text-[11px] text-white/30 uppercase tracking-widest font-medium">
          Live Preview
        </p>
      </div>

      {/* Card */}
      <div className="relative rounded-2xl border border-white/[0.12] bg-[#0d1525]/90 overflow-hidden flex flex-col shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
        {/* Shine overlay */}
        <div
          ref={shineRef}
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.05) 48%, rgba(255,255,255,0.13) 54%, rgba(255,255,255,0.05) 60%, transparent 72%)",
            transform: "translateX(-180%) skewX(-8deg)",
          }}
        />

        {/* ── Top accent bar ───────────────────────────────────────────────── */}
        <div
          className="h-[3px] w-full"
          style={{
            background: "linear-gradient(90deg, #38bdf8, #a855f7, #22d3ee)",
          }}
        />

        {/* ── Profile section — CENTERED ───────────────────────────────────── */}
        <div className="flex flex-col items-center text-center px-7 pt-8 pb-6 border-b border-white/[0.06]">
          {/* Runtime + active badges */}
          <div className="flex items-center gap-2 mb-5">
            {runtimeType === "platform_managed" ? (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                Platform · {provLabel}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                Self-Hosted
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>

          {/* Avatar — large, centered */}
          <div ref={avatarRef} className="mb-5">
            {avatarUrl ? (
              <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-white/20 shadow-[0_0_32px_rgba(56,189,248,0.2)]">
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className={`w-28 h-28 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-[0_0_32px_rgba(56,189,248,0.2)]`}
              >
                <span className="text-white text-[28px] font-bold">?</span>
              </div>
            )}
          </div>

          {/* Name — large */}
          <h3
            ref={nameRef}
            className={`font-bold text-[22px] leading-tight mb-1 transition-colors ${
              displayName ? "text-white" : "text-white/20"
            }`}
          >
            {name}
          </h3>

          {/* Wallet */}
          <p className="text-white/30 text-[12px] font-mono mb-3">
            {shortAddr}
          </p>

          {/* Bio */}
          <div
            ref={bioRef}
            style={{ opacity: bio ? 1 : 0.4, minHeight: "40px" }}
          >
            <p
              className={`text-[14px] leading-relaxed ${bio ? "text-white/55" : "text-white/20 italic"}`}
            >
              {bio || "Your agent bio will appear here..."}
            </p>
          </div>
        </div>

        {/* ── Stats + skills section ───────────────────────────────────────── */}
        <div className="px-7 py-6 flex flex-col gap-5">
          {/* Reputation bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white/35 uppercase tracking-wider">
                Reputation Score
              </span>
              <span className="text-white/30 text-[12px] font-medium">
                New Agent
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-0 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#22d3ee]" />
            </div>
          </div>

          {/* Rate + jobs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#050810]/70 rounded-xl px-4 py-3">
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">
                Rate / Task
              </p>
              <span
                ref={rateRef}
                className={`text-[18px] font-bold ${defaultRateOG ? "text-white" : "text-white/20"}`}
              >
                {rateLabel}
              </span>
            </div>
            <div className="bg-[#050810]/70 rounded-xl px-4 py-3">
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">
                Jobs Done
              </p>
              <p className="text-[18px] text-white font-bold">0</p>
            </div>
          </div>

          {/* Skills */}
          <div className="min-h-[32px]">
            {selectedSkillLabels.length === 0 ? (
              <p className="text-[12px] text-white/20 italic text-center">
                No skills selected yet
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSkillLabels.slice(0, 6).map((label, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/50"
                  >
                    {label}
                  </span>
                ))}
                {selectedSkillLabels.length > 6 && (
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/30">
                    +{selectedSkillLabels.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons (visual only) */}
          <div className="flex gap-3 pt-1">
            <div className="flex-1 px-4 py-2.5 bg-white/8 text-white/25 text-[13px] font-medium rounded-full text-center">
              Hire Agent
            </div>
            <div className="flex-1 px-4 py-2.5 border border-white/8 text-white/20 text-[13px] font-medium rounded-full text-center">
              Subscribe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
