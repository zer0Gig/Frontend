"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/utils";
import { PhaseIcon, phaseColor } from "@/components/ui/PhaseIcon";
import { Clock, AlertTriangle, Bot, Paperclip, Database } from "lucide-react";

interface ActivityEntry {
  _kind: "activity";
  id: string;
  job_id: number;
  phase: string;
  message: string;
  milestone_index: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ChatMessage {
  _kind: "chat";
  id: string;
  job_id: number;
  sender: "user" | "agent";
  message: string;
  msg_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  sendStatus?: "pending" | "sent" | "delivered" | "failed";
}

type StreamItem = ActivityEntry | ChatMessage;

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SendStatusIcon({ status }: { status?: string }) {
  if (status === "pending") return <span className="text-white/30 text-[10px] ml-1">🕐</span>;
  if (status === "sent") return <span className="text-white/30 text-[10px] ml-1">✓</span>;
  if (status === "delivered") return <span className="text-[#38bdf8]/60 text-[10px] ml-1">✓✓</span>;
  if (status === "failed") return (
    <button className="text-red-400 text-[10px] ml-1 hover:text-red-300 transition-colors" title="Failed — tap to retry">
      ⚠️
    </button>
  );
  return null;
}

function TypingDots() {
  return (
    <motion.div
      className="flex justify-start"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#a855f7]/10 border border-[#a855f7]/20">
        <p className="text-[10px] font-semibold text-[#a855f7]/60 mb-1.5">Agent</p>
        <div className="flex items-center gap-1 py-1">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#a855f7]/50"
              animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ActivityRow({ item }: { item: ActivityEntry }) {
  const color = phaseColor(item.phase);
  const isPulse = ["processing", "waiting_approval"].includes(item.phase);
  return (
    <div className="flex items-start gap-2 py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/5">
      <PhaseIcon phase={item.phase} size={14} className={`mt-0.5 ${color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-white/40 leading-relaxed truncate">
          {item.message}
          {isPulse && <span className="inline-block ml-1.5 w-1 h-1 rounded-full bg-white/30 animate-pulse align-middle" />}
        </p>
        {item.milestone_index !== null && item.milestone_index !== undefined && (
          <p className="text-[10px] text-white/20">M{item.milestone_index + 1}</p>
        )}
      </div>
      <p className="text-[10px] text-white/20 flex-shrink-0 mt-0.5">
        {formatRelativeTime(new Date(item.created_at).getTime() / 1000)}
      </p>
    </div>
  );
}

function MilestoneReadyCard({
  item,
  onApprove,
}: {
  item: ChatMessage;
  onApprove: (milestoneIndex: number) => Promise<boolean>;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const milestoneIndex = item.metadata?.milestoneIndex as number | undefined;

  const handleApprove = async () => {
    if (milestoneIndex === undefined) return;
    setLoading(true);
    setError(false);
    const ok = await onApprove(milestoneIndex);
    if (ok) setDone(true);
    else setError(true);
    setLoading(false);
  };

  return (
    <div className="max-w-[85%] rounded-2xl border border-[#a855f7]/20 bg-[#a855f7]/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">🤖</span>
        <p className="text-[11px] font-semibold text-[#a855f7]/70">Agent</p>
      </div>
      <p className="text-[13px] text-white/80 leading-relaxed">{item.message}</p>
      {error && <p className="text-red-400 text-[12px]">Approval failed. Please try again.</p>}
      {!done ? (
        <button
          onClick={handleApprove}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[13px] font-semibold hover:bg-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "Processing…" : "Go to Next Milestone →"}
        </button>
      ) : (
        <div className="py-2 text-center text-[12px] text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          ✓ Approved — agent is continuing
        </div>
      )}
      <p className="text-[10px] text-white/20 text-right">
        {formatRelativeTime(new Date(item.created_at).getTime() / 1000)}
      </p>
    </div>
  );
}

function FileAttachment({ meta }: { meta: Record<string, unknown> }) {
  const dataUrl = meta.fileData as string | undefined;
  const fileName = meta.fileName as string | undefined;
  const fileType = meta.fileType as string | undefined;
  const isImage = fileType?.startsWith("image/");

  if (isImage && dataUrl) {
    return (
      <div className="mt-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={fileName || "attachment"} className="max-w-full max-h-48 rounded-lg border border-white/10 object-contain" />
        {fileName && <p className="text-[10px] text-white/30 mt-1">{fileName}</p>}
      </div>
    );
  }

  if (dataUrl) {
    return (
      <a href={dataUrl} download={fileName || "file"} className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
        <span>📎</span>
        <span className="text-[12px] text-white/60">{fileName || "Download file"}</span>
      </a>
    );
  }

  const cid = meta.outputCID as string | undefined;
  if (cid) {
    return (
      <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
        <span>🗄️</span>
        <span className="text-[11px] text-white/40 font-mono truncate">{cid}</span>
      </div>
    );
  }

  return null;
}

function ChatBubble({
  item,
  onApprove,
  onRetry,
}: {
  item: ChatMessage;
  onApprove: (milestoneIndex: number) => Promise<boolean>;
  onRetry?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (item.msg_type === "milestone_ready") {
    return <MilestoneReadyCard item={item} onApprove={onApprove} />;
  }

  const isUser = item.sender === "user";
  const hasFile = !!item.metadata?.fileData || !!item.metadata?.outputCID;
  const isLong = item.message.length > 400;

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, scale: 0.95, x: isUser ? 12 : -12 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#38bdf8]/15 border border-[#38bdf8]/20"
            : "bg-[#a855f7]/10 border border-[#a855f7]/20"
        } ${item.sendStatus === "failed" ? "opacity-60" : ""}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[10px] font-semibold ${isUser ? "text-[#38bdf8]/60" : "text-[#a855f7]/60"}`}>
            {isUser ? "You" : "Agent"}
          </p>
          {isUser && <SendStatusIcon status={item.sendStatus} />}
        </div>

        <div className="relative">
          <p className={`text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap ${isLong && !expanded ? "line-clamp-6" : ""}`}>
            {item.message}
          </p>
          {isLong && (
            <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-white/40 hover:text-white/60 mt-1 transition-colors">
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {hasFile && <FileAttachment meta={item.metadata} />}

        {item.sendStatus === "failed" && onRetry && (
          <button onClick={onRetry} className="text-[11px] text-red-400 hover:text-red-300 mt-1 transition-colors">
            Tap to retry
          </button>
        )}

        <p className="text-[10px] text-white/20 mt-2 text-right">
          {formatRelativeTime(new Date(item.created_at).getTime() / 1000)}
        </p>
      </div>
    </motion.div>
  );
}

interface JobStreamProps {
  jobId: number;
}

export default function JobStream({ jobId }: JobStreamProps) {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [filePreview, setFilePreview] = useState<{ name: string; dataUrl: string; type: string } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = streamRef.current;
    if (!el) return;
    const target = el.scrollHeight - el.clientHeight;
    el.scrollTo({ top: Math.max(0, target), behavior: smooth ? "smooth" : "auto" });
  }, []);

  const checkNearBottom = useCallback(() => {
    const el = streamRef.current;
    if (!el) return true;
    const threshold = 150;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    const el = streamRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollButton(!checkNearBottom());
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [checkNearBottom]);

  useEffect(() => {
    if (checkNearBottom()) {
      requestAnimationFrame(() => scrollToBottom(true));
    } else {
      setShowScrollButton(true);
    }
  }, [items.length, checkNearBottom, scrollToBottom]);

  const mergeAndSort = useCallback(
    (activities: Omit<ActivityEntry, "_kind">[], messages: Omit<ChatMessage, "_kind">[]): StreamItem[] => {
      const a: StreamItem[] = activities.map(x => ({ ...x, _kind: "activity" as const }));
      const c: StreamItem[] = messages.map(x => ({ ...x, _kind: "chat" as const }));
      return [...a, ...c].sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      const [actRes, msgRes] = await Promise.all([
        supabase.from("agent_activity").select("*").eq("job_id", jobId).order("created_at", { ascending: true }).limit(100),
        supabase.from("job_messages").select("*").eq("job_id", jobId).order("created_at", { ascending: true }).limit(200),
      ]);
      if (!mounted) return;
      setItems(mergeAndSort(actRes.data ?? [], msgRes.data ?? []));
      setLoading(false);
      requestAnimationFrame(() => {
        const el = streamRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    };
    loadAll();

    const actChannel = supabase
      .channel(`stream_activity:${jobId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_activity", filter: `job_id=eq.${jobId}` },
        (p) => setItems(prev => [...prev, { ...(p.new as Omit<ActivityEntry, "_kind">), _kind: "activity" }]))
      .subscribe();

    const msgChannel = supabase
      .channel(`stream_messages:${jobId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "job_messages", filter: `job_id=eq.${jobId}` },
        (p) => {
          const newItem: ChatMessage = { ...(p.new as Omit<ChatMessage, "_kind">), _kind: "chat" as const };
          setItems(prev => {
            if (newItem.sender === "user") {
              const replaced = prev.map(item => {
                if (item._kind === "chat" && item.id.startsWith("temp-") &&
                    (item as ChatMessage).sender === "user" &&
                    (item as ChatMessage).message === newItem.message) {
                  return { ...newItem, sendStatus: "delivered" as const };
                }
                return item;
              });
              const stillHasTemp = replaced.some(item =>
                item._kind === "chat" && item.id.startsWith("temp-")
              );
              if (stillHasTemp) return replaced;
              const alreadyExists = replaced.some(item =>
                item._kind === "chat" && item.id === newItem.id
              );
              return alreadyExists ? replaced : [...replaced, newItem];
            }
            setIsWaitingForAgent(false);
            return [...prev, newItem];
          });
        })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(actChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [jobId, mergeAndSort]);

  const handleApprove = async (milestoneIndex: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/milestone-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, milestoneIndex }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const sendMessage = async (text: string, file?: { name: string; dataUrl: string; type: string }) => {
    if ((!text.trim() && !file) || sending) return;
    const msgText = text.trim() || file!.name;
    const msgType = file ? "file" : "text";
    const metadata = file
      ? { fileName: file.name, fileType: file.type, fileData: file.dataUrl }
      : {};

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMsg: ChatMessage = {
      _kind: "chat",
      id: tempId,
      job_id: jobId,
      sender: "user",
      message: msgText,
      msg_type: msgType,
      metadata,
      created_at: new Date().toISOString(),
      sendStatus: "pending",
    };
    setItems(prev => [...prev, optimisticMsg]);

    setInput("");
    setFilePreview(null);
    setSending(true);
    setIsWaitingForAgent(true);

    try {
      const res = await fetch("/api/job-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, sender: "user", message: msgText, msgType, metadata }),
      });
      if (!res.ok) throw new Error("Send failed");
      setItems(prev => prev.map(item =>
        item._kind === "chat" && item.id === tempId
          ? { ...item, sendStatus: "sent" as const }
          : item
      ));
    } catch {
      setItems(prev => prev.map(item =>
        item._kind === "chat" && item.id === tempId
          ? { ...item, sendStatus: "failed" as const }
          : item
      ));
    } finally {
      setSending(false);
    }
  };

  const handleRetry = useCallback((item: ChatMessage) => {
    if (item.sender !== "user") return;
    setItems(prev => prev.filter(i => i.id !== item.id));
    const fileData = item.metadata?.fileData as string | undefined;
    const fileName = item.metadata?.fileName as string | undefined;
    const fileType = item.metadata?.fileType as string | undefined;
    const file = fileData && fileName
      ? { name: fileName, dataUrl: fileData, type: fileType || "text/plain" }
      : undefined;
    sendMessage(item.message, file);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input, filePreview ?? undefined);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File too large (max 2 MB). For larger files, upload to 0G Storage first.");
      return;
    }
    const dataUrl = await readFileAsDataURL(file);
    setFilePreview({ name: file.name, dataUrl, type: file.type });
    e.target.value = "";
  };

  const visibleItems = showActivity ? items : items.filter(i => i._kind === "chat");
  const hasActivity = items.some(i => i._kind === "activity");
  const latestPhase = [...items].reverse().find(i => i._kind === "activity") as ActivityEntry | undefined;
  const isAgentActive = latestPhase && !["completed", "error"].includes(latestPhase.phase);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 h-96 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 flex flex-col relative" style={{ height: 520 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {isAgentActive
              ? <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              : <div className="w-2 h-2 rounded-full bg-white/20" />
            }
            <h3 className="text-[13px] font-medium text-white/60 uppercase tracking-wider">
              {isAgentActive ? "Agent Active" : "Job Stream"}
            </h3>
          </div>
          {hasActivity && (
            <button
              onClick={() => setShowActivity(v => !v)}
              className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                showActivity ? "border-white/20 text-white/50 bg-white/5" : "border-white/10 text-white/25 hover:border-white/20 hover:text-white/40"
              }`}
            >
              {showActivity ? "Hide logs" : "Show logs"}
            </button>
          )}
        </div>
        {latestPhase && (
          <div className={`flex items-center gap-1.5 text-[11px] ${phaseColor(latestPhase.phase)}`}>
            <PhaseIcon phase={latestPhase.phase} size={12} />
            <span className="capitalize text-white/40">{latestPhase.phase.replace(/_/g, " ")}</span>
          </div>
        )}
      </div>

      {/* Stream */}
      <div ref={streamRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {visibleItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/25 text-[12px] text-center max-w-xs">
              Once the agent starts working, its output and your conversation will appear here.
              You can send the agent messages or files at any time.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleItems.map((item) => (
              <motion.div
                key={`${item._kind}-${item.id}`}
                initial={item._kind === "activity"
                  ? { opacity: 0, x: -12 }
                  : { opacity: 0, scale: 0.95, x: item.sender === "user" ? 12 : -12 }
                }
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  duration: item._kind === "activity" ? 0.3 : 0.25,
                  ease: item._kind === "activity" ? [0.25, 0.4, 0.25, 1] : [0.34, 1.56, 0.64, 1],
                }}
              >
                {item._kind === "activity" ? (
                  <ActivityRow item={item} />
                ) : (
                  <ChatBubble
                    item={item}
                    onApprove={handleApprove}
                    onRetry={() => handleRetry(item)}
                  />
                )}
              </motion.div>
            ))}
            {isWaitingForAgent && <TypingDots key="typing-indicator" />}
          </AnimatePresence>
        )}
        <div />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => { scrollToBottom(true); setShowScrollButton(false); }}
            className="absolute bottom-32 right-6 w-8 h-8 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] hover:bg-[#38bdf8]/30 transition-colors z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* File preview bar */}
      {filePreview && (
        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-3 bg-[#050810]/60">
          {filePreview.type.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={filePreview.dataUrl} alt="" className="h-10 w-10 object-cover rounded-md border border-white/10" />
          ) : (
            <div className="h-10 w-10 rounded-md border border-white/10 flex items-center justify-center text-lg">📎</div>
          )}
          <p className="text-[12px] text-white/50 flex-1 truncate">{filePreview.name}</p>
          <button onClick={() => setFilePreview(null)} className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none">×</button>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-white/10 flex items-end gap-2 flex-shrink-0">
        <button
          onClick={() => fileRef.current?.click()}
          title="Attach file (max 2 MB)"
          className="w-9 h-9 flex-shrink-0 rounded-xl border border-white/10 flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.txt,.md,.json,.csv" onChange={handleFileSelect} />

        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message the agent or attach a file..."
          rows={1}
          className="flex-1 bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white/80 text-[13px] placeholder:text-white/25 focus:outline-none focus:border-white/25 resize-none"
          disabled={sending}
        />

        <button
          onClick={() => sendMessage(input, filePreview ?? undefined)}
          disabled={sending || (!input.trim() && !filePreview)}
          className="w-9 h-9 flex-shrink-0 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] hover:bg-[#38bdf8]/30 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
