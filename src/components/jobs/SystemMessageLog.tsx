"use client";

import { useJobEvents } from "@/hooks/useJobEvents";
import { type JobEvent } from "@/lib/supabase";

interface SystemMessageLogProps {
  jobId: number;
  maxEntries?: number;
}

export default function SystemMessageLog({ jobId, maxEntries = 15 }: SystemMessageLogProps) {
  const events = useJobEvents(jobId);
  const displayEvents = events.slice(-maxEntries);

  return (
    <div className="space-y-2">
      {displayEvents.map((event: JobEvent, index: number) => (
        <div
          key={`${event.id}-${index}`}
          className="p-2 rounded bg-white/5 text-white/70"
        >
          <span className="text-xs opacity-50 uppercase">{event.event_type}</span>
          <p className="text-sm">{JSON.stringify(event.metadata || {})}</p>
          <span className="text-xs opacity-50">
            {new Date(event.created_at).toLocaleTimeString()}
          </span>
        </div>
      ))}
      {displayEvents.length === 0 && (
        <p className="text-white/30 text-center py-4 text-sm">No activity yet.</p>
      )}
    </div>
  );
}
