-- File/document foundation. `entity_type`/`entity_id` let Pass 2's project
-- documents, Pass 3's builder credentials, etc. attach to this same table
-- instead of each module rolling its own upload/storage logic.

CREATE TABLE IF NOT EXISTS files (
  id CHAR(36) PRIMARY KEY,
  owner_user_id CHAR(36) NOT NULL,
  entity_type VARCHAR(100) NULL,
  entity_id VARCHAR(100) NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  is_private TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_files_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_files_entity (entity_type, entity_id),
  INDEX idx_files_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
