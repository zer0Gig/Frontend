-- Add metadata and msg_type columns to job_messages
ALTER TABLE job_messages
  ADD COLUMN IF NOT EXISTS msg_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

-- Constraint: only known types allowed
ALTER TABLE job_messages
  DROP CONSTRAINT IF EXISTS job_messages_msg_type_check;
ALTER TABLE job_messages
  ADD CONSTRAINT job_messages_msg_type_check
    CHECK (msg_type IN ('text', 'file', 'activity', 'milestone_ready', 'milestone_approved'));
