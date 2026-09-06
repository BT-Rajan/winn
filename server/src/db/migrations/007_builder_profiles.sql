-- Pass 3 — Builder Experience. One profile per builder user, the single
-- source of truth Pass 4 (marketplace access), Pass 5 (matching) and
-- Pass 8 (admin verification) all read from — no per-experience copy.

CREATE TABLE IF NOT EXISTS builder_profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  company_name VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NULL,
  years_experience SMALLINT UNSIGNED NULL,
  service_locations JSON NULL,
  specialties JSON NULL,
  -- Verification is a core-level concept (see constitution). Pass 3 only
  -- ever moves a profile between unverified and pending (submitted).
  -- 'verified' / 'rejected' are set by Pass 8's admin review.
  verification_status ENUM('unverified', 'pending', 'verified', 'rejected') NOT NULL DEFAULT 'unverified',
  submitted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_builder_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_builder_profiles_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
