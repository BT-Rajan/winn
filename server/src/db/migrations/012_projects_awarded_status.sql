-- Pass 6 adds a selection outcome: once the customer awards a proposal,
-- the project is no longer open for new bids. This extends the same
-- status column Pass 2 already defined — one status, one source of
-- truth — rather than a separate "is_awarded" flag that could disagree
-- with it.

ALTER TABLE projects
  MODIFY COLUMN status ENUM('draft', 'submitted', 'verified', 'rejected', 'awarded') NOT NULL DEFAULT 'draft';
