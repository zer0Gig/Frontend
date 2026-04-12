"use client";

import { useState, useEffect } from "react";
import { supabase, type JobEvent } from "@/lib/supabase";

// ── Insert a job event (called from job actions) ──────────────────────────────

export async function insertJobEvent(
  jobId: number,
  eventType: JobEvent["event_type"],
  actor: string,
  metadata: Record<string, unknown> = {}
) {
  await supabase.from("job_events").insert({
    job_id:     jobId,
    event_type: eventType,
    actor:      actor.toLowerCase(),
    metadata,
  });
}

// ── Real-time feed for a specific job ─────────────────────────────────────────

export function useJobEvents(jobId: number | undefined) {
  const [events, setEvents] = useState<JobEvent[]>([]);

  useEffect(() => {
    if (!jobId) return;

    // Fetch existing events
    supabase
      .from("job_events")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setEvents(data ?? []));

    // Subscribe to new events in real-time
    const channel = supabase
      .channel(`job_events:${jobId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "job_events", filter: `job_id=eq.${jobId}` },
        (payload) => setEvents((prev) => [...prev, payload.new as JobEvent])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  return events;
}

// ── Real-time feed for a wallet (all jobs involving this address) ──────────────

export function useActivityFeed(address: string | undefined, limit = 20) {
  const [events, setEvents] = useState<JobEvent[]>([]);

  useEffect(() => {
    if (!address) return;

    const addr = address.toLowerCase();

    supabase
      .from("job_events")
      .select("*")
      .eq("actor", addr)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => setEvents(data ?? []));

    const channel = supabase
      .channel(`activity:${addr}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "job_events", filter: `actor=eq.${addr}` },
        (payload) => setEvents((prev) => [payload.new as JobEvent, ...prev].slice(0, limit))
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [address, limit]);

  return events;
}
