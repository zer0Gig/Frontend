"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ShinyText from "./ShinyText/ShinyText";

interface LogLine {
  text: string;
  color: string;
  delay: number;
}

const ANIMATION_DURATION = 12000;

const FULL_LOG: LogLine[][] = [
  [
    { text: "[JOB] New job received: \"Build a React landing page for my SaaS\"", color: "text-white", delay: 0 },
  ],
  [
    { text: "", color: "text-white", delay: 200 },
    { text: "[1/3] EXECUTING SKILLS...", color: "text-cyan-400", delay: 300 },
    { text: "  web_search    → \"landing page SaaS design trends 2024\"", color: "text-white/70", delay: 700 },
    { text: "  github_reader → \"found 3 similar repos: nextjs-saas-starter...\"", color: "text-white/70", delay: 1200 },
    { text: "  code_exec     → \"generating React components...\"", color: "text-white/70", delay: 1700 },
  ],
  [
    { text: "", color: "text-white", delay: 2200 },
    { text: "[2/3] SELF-EVALUATING...", color: "text-amber-400", delay: 2300 },
  ],
  [
    { text: "  Score: 7,200/10,000  ████████░░░░", color: "text-amber-400", delay: 2800 },
  ],
  [
    { text: "  ⚠️  BELOW THRESHOLD (8,000)", color: "text-red-400", delay: 3300 },
    { text: "  → Retrying with improvement prompt...", color: "text-amber-300", delay: 3800 },
  ],
  [
    { text: "", color: "text-white", delay: 4300 },
    { text: "[3/3] SELF-EVALUATING (attempt 2/3)...", color: "text-cyan-400", delay: 4400 },
    { text: "  Score: 9,100/10,000  ██████████░░", color: "text-emerald-400", delay: 4900 },
    { text: "  ✅ PASSED — Quality threshold met", color: "text-emerald-400", delay: 5400 },
  ],
  [
    { text: "", color: "text-white", delay: 5900 },
    { text: "  → Uploading output to 0G Storage...", color: "text-white/70", delay: 6000 },
    { text: "  ✓ Output CID: zgstorage/4f8a2b3c9d1e...", color: "text-emerald-400", delay: 6600 },
  ],
  [
    { text: "", color: "text-white", delay: 7100 },
    { text: "[✓] MILESTONE READY", color: "text-emerald-400", delay: 7200 },
  ],
];

const TELEGRAM_MESSAGE = {
  title: "Job Complete!",
  body: "Your landing page is ready. CID: 4f8a2b3c9d1e",
  time: "now",
};

function TelegramCard() {
  return (
    <div className="mt-3 ml-4 max-w-[260px]">
      <div className="bg-[#1e293b] rounded-2xl rounded-tl-sm p-3 shadow-lg border border-white/10">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 bg-[#0088cc] rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
          <span className="text-white font-medium text-sm">Telegram Bot</span>
        </div>
        <div className="bg-[#2a3f5f] rounded-xl p-3">
          <p className="text-white text-sm font-medium">{TELEGRAM_MESSAGE.title}</p>
          <p className="text-white/70 text-xs mt-1">{TELEGRAM_MESSAGE.body}</p>
        </div>
        <div className="flex justify-end mt-1.5">
          <span className="text-white/30 text-[10px]">{TELEGRAM_MESSAGE.time}</span>
        </div>
      </div>
    </div>
  );
}

export default function AgentLiveDemo() {
  const [visibleLines, setVisibleLines] = useState<LogLine[]>([]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [scoreWidth, setScoreWidth] = useState(0);
  const [scoreWidth2, setScoreWidth2] = useState(0);
  const [showTelegram, setShowTelegram] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  const resetAnimation = useCallback(() => {
    setVisibleLines([]);
    setCurrentPhase(0);
    setScoreWidth(0);
    setScoreWidth2(0);
    setShowTelegram(false);
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    let timeoutIds: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      resetAnimation();

      FULL_LOG.forEach((phaseLines, phaseIndex) => {
        phaseLines.forEach((line, lineIndex) => {
          const totalDelay = line.delay;

          const tid = setTimeout(() => {
            setVisibleLines((prev) => [...prev, line]);

            if (line.text.includes("7,200/10,000")) {
              setTimeout(() => setScoreWidth(72), 100);
            }
            if (line.text.includes("9,100/10,000")) {
              setTimeout(() => setScoreWidth2(91), 100);
            }
          }, totalDelay);

          timeoutIds.push(tid);
        });
      });

      const telegramDelay = 7200;
      const telegramTid = setTimeout(() => setShowTelegram(true), telegramDelay);
      timeoutIds.push(telegramTid);

      const loopTid = setTimeout(() => {
        runAnimation();
      }, ANIMATION_DURATION);

      timeoutIds.push(loopTid);

      setCurrentPhase(FULL_LOG.length);
    };

    runAnimation();

    const cursorInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);

    return () => {
      timeoutIds.forEach(clearTimeout);
      clearInterval(cursorInterval);
    };
  }, [resetAnimation]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative py-16 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050810]/50 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-sm font-medium">Live Demo</span>
          </div>
          <h2
            style={{
              background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            <ShinyText
              text="Watch an Agent Think"
              speed={3}
              color="rgba(255,255,255,0.85)"
              shineColor="#22d3ee"
              spread={110}
              yoyo
              className="text-3xl md:text-5xl font-medium"
            />
          </h2>
          <p className="text-white/50 text-sm">
            See the F1 self-evaluation loop in action — retrying until quality passes
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#050810] overflow-hidden shadow-2xl shadow-black/50">
          <div className="flex items-center gap-1.5 px-4 py-3 bg-[#0a0f1a] border-b border-white/10">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-3 text-white/40 text-xs font-mono">agent-runtime — zsh</span>
          </div>

          <div className="p-4 min-h-[320px] font-mono text-[13px] leading-relaxed">
            {visibleLines.map((line, index) => (
              <div key={index} className="flex items-start">
                <span className={line.color}>{line.text}</span>
                {index === visibleLines.length - 1 && (
                  <span
                    className={`ml-0.5 w-2 h-4 bg-white/70 inline-block ${
                      cursorVisible ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ animation: "none" }}
                  />
                )}
              </div>
            ))}

            {visibleLines.length === 0 && (
              <div className="flex items-center text-white/30">
                <span>Initializing agent...</span>
                <span
                  className={`ml-0.5 w-2 h-4 bg-white/50 inline-block ${
                    cursorVisible ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            )}

            {visibleLines.some((l) => l.text.includes("7,200/10,000")) && (
              <div className="mt-2 ml-8">
                <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${scoreWidth}%` }}
                  />
                </div>
              </div>
            )}

            {visibleLines.some((l) => l.text.includes("9,100/10,000")) && (
              <div className="mt-2 ml-8">
                <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${scoreWidth2}%` }}
                  />
                </div>
              </div>
            )}

            {showTelegram && <TelegramCard />}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-white/40">Skill Execution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-white/40">Self-Evaluation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-white/40">Quality Passed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-white/40">Retry Required</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
