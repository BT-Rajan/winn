-- Pass 2 — Customer Experience. One `projects` table is the single source
-- of truth for a submitted project; Pass 3/4 (builder feed, matching,
-- marketplace) read from this same table rather than a per-experience copy.

CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) PRIMARY KEY,
  customer_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  project_type VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  size_value DECIMAL(12, 2) NULL,
  size_unit VARCHAR(20) NULL,
  budget_min DECIMAL(14, 2) NULL,
  budget_max DECIMAL(14, 2) NULL,
  requirements TEXT NULL,
  -- 'verified' / 'rejected' are set by Pass 8's admin review — Pass 2 only
  -- ever moves a project between draft and submitted.
  status ENUM('draft', 'submitted', 'verified', 'rejected') NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_projects_customer (customer_id),
  INDEX idx_projects_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
