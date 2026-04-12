import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentProfile {
  agent_id:     number;
  owner_address: string;
  display_name: string | null;
  avatar_url:   string | null;
  bio:          string | null;
  tags:         string[] | null;
  featured:     boolean;
  created_at:   string;
  updated_at:   string;
}

export interface JobEvent {
  id:         string;
  job_id:     number;
  event_type: "job_posted" | "proposal_submitted" | "proposal_accepted" | "milestone_released" | "job_completed" | "job_cancelled";
  actor:      string | null;
  metadata:   Record<string, unknown>;
  created_at: string;
}

export interface AgentActivityEntry {
  id:               string;
  job_id:           number;
  agent_id:         string | null;
  agent_wallet:     string | null;
  phase:            string;
  message:          string;
  milestone_index:  number | null;
  metadata:         Record<string, unknown>;
  created_at:       string;
}
