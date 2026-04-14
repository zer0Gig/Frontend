"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAccount } from "wagmi";

interface ClientBotConfig {
  subscription_id: number;
  client_address: string;
  bot_token: string;
  allowed_chats: string[];
  updated_at: string;
}

export default function ClientTelegramBotSection({ subscriptionId }: { subscriptionId: bigint }) {
  const { address } = useAccount();
  const subIdNum = Number(subscriptionId);

  const [existing, setExisting]   = useState<ClientBotConfig | null>(null);
  const [loading, setLoading]     = useState(true);
  const [botToken, setBotToken]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [removing, setRemoving]   = useState(false);

  // Load existing config
  useEffect(() => {
    supabase
      .from("client_bot_configs")
      .select("*")
      .eq("subscription_id", subIdNum)
      .maybeSingle()
      .then(({ data }) => {
        setExisting(data as ClientBotConfig | null);
        setLoading(false);
      });
  }, [subIdNum]);

  const handleSave = async () => {
    if (!botToken.trim() || !address) return;
    setSaving(true);
    setSaved(false);

    const { data, error } = await supabase
      .from("client_bot_configs")
      .upsert(
        {
          subscription_id: subIdNum,
          client_address:  address,
          bot_token:       botToken.trim(),
          allowed_chats:   [],
          updated_at:      new Date().toISOString(),
        },
        { onConflict: "subscription_id" }
      )
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setExisting(data as ClientBotConfig);
      setBotToken("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleRemove = async () => {
    if (!existing) return;
    setRemoving(true);
    await supabase
      .from("client_bot_configs")
      .delete()
      .eq("subscription_id", subIdNum);
    setExisting(null);
    setRemoving(false);
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mt-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider">
            Customer Service Bot
          </h2>
          <p className="text-[12px] text-white/30 mt-1">
            Your agent answers customer Telegram messages 24/7 using AI.
            Each client brings their own bot.
          </p>
        </div>
        {existing && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        )}
      </div>

      {existing ? (
        /* ── Configured state ── */
        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.07] bg-[#050810]/60 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Telegram icon */}
              <div className="w-8 h-8 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#38bdf8]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] text-white/70 font-medium">Bot configured</p>
                <p className="text-[11px] text-white/30 font-mono truncate">
                  {showToken
                    ? existing.bot_token
                    : `${existing.bot_token.slice(0, 8)}${"•".repeat(16)}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowToken(v => !v)}
                className="text-white/30 hover:text-white/60 transition-colors p-1"
                title={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-white/25">
            Updated {new Date(existing.updated_at).toLocaleDateString()}
          </p>

          <div className="flex gap-2 pt-1">
            {/* Replace token */}
            <div className="flex-1 flex gap-2">
              <input
                type="password"
                value={botToken}
                onChange={e => setBotToken(e.target.value)}
                placeholder="Paste new token to replace"
                className="flex-1 bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-white/25"
              />
              <button
                onClick={handleSave}
                disabled={saving || !botToken.trim()}
                className="px-4 py-2 bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-[12px] font-medium rounded-xl disabled:opacity-40 hover:bg-[#38bdf8]/20 transition-colors"
              >
                {saving ? "Saving…" : "Replace"}
              </button>
            </div>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="px-3 py-2 border border-red-500/20 text-red-400/60 text-[12px] rounded-xl hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              {removing ? "…" : "Remove"}
            </button>
          </div>
        </div>
      ) : (
        /* ── Not configured state ── */
        <div className="space-y-4">
          {/* Steps */}
          <div className="rounded-xl border border-white/[0.06] bg-[#050810]/40 p-4 space-y-2.5">
            {[
              { n: "1", text: "Open Telegram and message @BotFather" },
              { n: "2", text: "Send /newbot — choose a name and username" },
              { n: "3", text: "Copy the bot token BotFather gives you" },
              { n: "4", text: "Paste it below — your agent is ready 24/7" },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {s.n}
                </span>
                <p className="text-[12px] text-white/45 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="password"
              value={botToken}
              onChange={e => setBotToken(e.target.value)}
              placeholder="7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxx"
              className="flex-1 bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-white/25 font-mono"
            />
            <button
              onClick={handleSave}
              disabled={saving || !botToken.trim()}
              className="px-5 py-2.5 bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-[13px] font-medium rounded-xl disabled:opacity-40 hover:bg-[#38bdf8]/20 transition-colors whitespace-nowrap"
            >
              {saving ? "Saving…" : "Activate Bot"}
            </button>
          </div>

          {saved && (
            <p className="text-[12px] text-emerald-400/70">
              Bot configured — your agent will start answering customers shortly.
            </p>
          )}

          <p className="text-[11px] text-white/20">
            The token is stored securely. Your agent uses it to reply to customers on your behalf.
          </p>
        </div>
      )}
    </div>
  );
}
