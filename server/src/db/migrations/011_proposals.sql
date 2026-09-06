-- Pass 6 — Proposal & Selection. One proposal per builder per project;
-- editing a submitted bid updates this same row rather than creating a
-- new one, so there's exactly one current bid to compare, never a history
-- of superseded ones cluttering the comparison.

CREATE TABLE IF NOT EXISTS proposals (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  builder_profile_id CHAR(36) NOT NULL,
  price DECIMAL(14, 2) NOT NULL,
  duration_value SMALLINT UNSIGNED NOT NULL,
  duration_unit ENUM('days', 'weeks', 'months') NOT NULL DEFAULT 'months',
  scope TEXT NOT NULL,
  exclusions TEXT NULL,
  payment_terms TEXT NULL,
  warranty TEXT NULL,
  status ENUM('submitted', 'withdrawn', 'awarded', 'rejected') NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_proposals_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_proposals_builder FOREIGN KEY (builder_profile_id) REFERENCES builder_profiles(id) ON DELETE CASCADE,
  CONSTRAINT uq_proposal_project_builder UNIQUE (project_id, builder_profile_id),
  INDEX idx_proposals_project (project_id),
  INDEX idx_proposals_builder (builder_profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
