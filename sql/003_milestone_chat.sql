-- milestone_approvals: records when a user approves a milestone
CREATE TABLE IF NOT EXISTS milestone_approvals (
  id           BIGSERIAL PRIMARY KEY,
  job_id       BIGINT  NOT NULL,
  milestone_index INTEGER NOT NULL,
  approved_by  TEXT,
  feedback     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, milestone_index)
);

-- Enable realtime for instant feedback to the agent
ALTER TABLE milestone_approvals REPLICA IDENTITY FULL;

-- job_messages: bidirectional chat between user and agent
CREATE TABLE IF NOT EXISTS job_messages (
  id          BIGSERIAL PRIMARY KEY,
  job_id      BIGINT NOT NULL,
  sender      TEXT   NOT NULL CHECK (sender IN ('user', 'agent')),
  message     TEXT   NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_messages REPLICA IDENTITY FULL;

-- Index for fast per-job queries
CREATE INDEX IF NOT EXISTS idx_milestone_approvals_job ON milestone_approvals (job_id, milestone_index);
CREATE INDEX IF NOT EXISTS idx_job_messages_job ON job_messages (job_id, created_at);
