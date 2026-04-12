"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/utils";

interface ChatMessage {
  id: string;
  job_id: number;
  sender: "user" | "agent";
  message: string;
  created_at: string;
}

export default function JobChat({ jobId }: { jobId: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load history + subscribe to realtime
  useEffect(() => {
    supabase
      .from("job_messages")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages((data as ChatMessage[]) ?? []));

    const channel = supabase
      .channel(`job_messages:${jobId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "job_messages", filter: `job_id=eq.${jobId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    try {
      await fetch("/api/job-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, sender: "user", message: text }),
      });
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 flex flex-col" style={{ height: 380 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wider">
          Chat with Agent
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/25 text-[12px] text-center">
              No messages yet. Ask the agent a question or leave feedback here.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  msg.sender === "user"
                    ? "bg-[#38bdf8]/15 border border-[#38bdf8]/20 text-white/80"
                    : "bg-[#a855f7]/10 border border-[#a855f7]/20 text-white/80"
                }`}
              >
                <p className={`text-[10px] font-semibold mb-1 ${msg.sender === "user" ? "text-[#38bdf8]/60" : "text-[#a855f7]/60"}`}>
                  {msg.sender === "user" ? "You" : "Agent"}
                </p>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                <p className="text-[10px] text-white/20 mt-1 text-right">
                  {formatRelativeTime(new Date(msg.created_at).getTime() / 1000)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10 flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message the agent… (Enter to send)"
          rows={1}
          className="flex-1 bg-[#050810]/80 border border-white/10 rounded-xl px-3 py-2 text-white text-[13px] placeholder:text-white/25 focus:outline-none focus:border-white/20 resize-none"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="px-4 py-2 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/20 text-[#38bdf8] text-[13px] font-semibold hover:bg-[#38bdf8]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
