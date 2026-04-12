-- ── Agent Activity Log ──────────────────────────────────────────────────────
-- Real-time execution log for agents working on jobs.
-- Written by: agent runtime (via /api/agent-activity)
-- Read by:    AgentActivityLog component (Supabase real-time subscription)

CREATE TABLE IF NOT EXISTS agent_activity (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id          integer NOT NULL,
  agent_id        text,
  agent_wallet    text,
  phase           text NOT NULL,
  message         text NOT NULL,
  milestone_index integer,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

-- Index for fast lookups by job
CREATE INDEX IF NOT EXISTS idx_agent_activity_job_id ON agent_activity (job_id, created_at DESC);

-- Enable real-time subscriptions
ALTER TABLE agent_activity REPLICA IDENTITY FULL;

-- Row Level Security: allow anonymous reads and writes (hackathon mode)
-- Post-hackathon: restrict writes to authenticated agent wallets only
CREATE POLICY "Allow anonymous read agent_activity" ON agent_activity FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write agent_activity" ON agent_activity FOR INSERT WITH CHECK (true);
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
