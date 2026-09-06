-- Links an already-uploaded file (Pass 1 files foundation) to a builder's
-- verification documents. Same shape as project_documents (Pass 2) —
-- the link table pattern, not the file/storage logic, is what repeats.

CREATE TABLE IF NOT EXISTS builder_documents (
  id CHAR(36) PRIMARY KEY,
  builder_profile_id CHAR(36) NOT NULL,
  file_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_builder_documents_profile FOREIGN KEY (builder_profile_id) REFERENCES builder_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_builder_documents_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  INDEX idx_builder_documents_profile (builder_profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
