-- Links an already-uploaded file (files table, Pass 1 foundation) to a
-- project. The file itself, its storage and its access rule are never
-- duplicated here — this table only records that the link exists.

CREATE TABLE IF NOT EXISTS project_documents (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  file_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_project_documents_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_documents_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  INDEX idx_project_documents_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
