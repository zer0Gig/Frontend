"use client";

import { useEffect, useState } from "react";

interface ConnectTelegramButtonProps {
  /** Optional: prefill the chatId field after linking */
  onLinked?: (chatId: string) => void;
  /** Compact mode — just the icon + status, no explanation text */
  compact?: boolean;
  /** Owner wallet address — needed to persist chatId to agent_profiles.metadata for runtime fallback */
  ownerAddress?: string;
}

export default function ConnectTelegramButton({ onLinked, compact = false, ownerAddress }: ConnectTelegramButtonProps) {
  const [status, setStatus] = useState<"idle" | "checking" | "linked" | "error">("checking");
  const [chatId, setChatId] = useState<string>("");

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";
  const deepLink    = botUsername ? `https://t.me/${botUsername}?start=true` : "";

  // Poll the /api/telegram-link endpoint to see if this browser session is linked
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/telegram-link");
        if (!res.ok) { setStatus("idle"); return; }
        const data = await res.json();
        if (cancelled) return;
        if (data.linked) {
          const linkedChatId = data.chatId;
          setChatId(linkedChatId);
          setStatus("linked");
          // Store in window.__pendingProfile so registration flow picks it up
          const pending = (window as any).__pendingProfile || {};
          (window as any).__pendingProfile = {
            ...pending,
            prebuiltSkillConfigs: {
              ...(pending.prebuiltSkillConfigs || {}),
              telegram_notify: {
                ...(pending.prebuiltSkillConfigs?.telegram_notify || {}),
                chatId: linkedChatId,
              },
            },
          };
          // Also persist to agent_profiles.metadata (for runtime fallback when Telegram paired after registration)
          const resolvedOwner = ownerAddress || (window as any).__telegramOwnerAddress;
          if (resolvedOwner) {
            (window as any).__telegramOwnerAddress = resolvedOwner;
            try {
              await fetch("/api/telegram-link/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ownerAddress: resolvedOwner,
                  chatId: linkedChatId,
                }),
              });
            } catch {
              // non-fatal — window.__pendingProfile covers the registration flow
            }
          }
          onLinked?.(linkedChatId);
        } else {
          setStatus("idle");
        }
      } catch {
        setStatus("idle");
      }
    }

    check();

    // Poll every 5s while idle so the status updates quickly after the user taps Start in Telegram
    const interval = setInterval(() => {
      if (status !== "linked") check();
    }, 5000);

    return () => { cancelled = true; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!botUsername) {
    return compact ? null : (
      <p className="text-[11px] text-white/25 italic">
        Telegram not configured — set <code>NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</code> to enable.
      </p>
    );
  }

  if (status === "linked") {
    return (
      <div className={`flex items-center gap-2 ${compact ? "" : "rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"}`}>
        <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-emerald-400 font-medium">Telegram connected</p>
          {!compact && (
            <p className="text-[10px] text-white/30 font-mono mt-0.5">Chat ID: {chatId}</p>
          )}
        </div>
        {!compact && (
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-white/30 hover:text-white/50 transition-colors flex-shrink-0"
          >
            Open bot ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "" : "space-y-2"}>
      {!compact && (
        <p className="text-[11px] text-white/35 leading-relaxed">
          Connect your Telegram to receive milestone notifications and approve jobs directly from your phone.
        </p>
      )}
      <a
        href={deepLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 rounded-xl border transition-colors ${
          compact
            ? "px-3 py-1.5 border-[#38bdf8]/20 bg-[#38bdf8]/5 text-[#38bdf8]/70 hover:bg-[#38bdf8]/10 text-[11px]"
            : "px-4 py-3 border-[#38bdf8]/25 bg-[#38bdf8]/8 text-[#38bdf8] hover:bg-[#38bdf8]/12 text-[13px]"
        }`}
      >
        {/* Telegram icon */}
        <svg className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
        </svg>
        <span className="font-medium">Connect Telegram</span>
        {!compact && <span className="text-[#38bdf8]/40 text-[11px] ml-auto">tap Start in the bot →</span>}
      </a>

      {status === "checking" && (
        <p className="text-[10px] text-white/25 flex items-center gap-1">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Checking link status…
        </p>
      )}
    </div>
  );
}
