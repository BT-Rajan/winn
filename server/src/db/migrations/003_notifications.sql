-- Notification foundation. Pass 1 delivers in-app only; the `channel`
-- column and service-layer abstraction let email/SMS plug in later
-- without a schema change or a second notification system.

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  channel ENUM('in_app') NOT NULL DEFAULT 'in_app',
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  read_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
