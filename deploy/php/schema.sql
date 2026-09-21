-- Copyright (c) 2026 Trent (PWL31).
-- Import into a NEW empty database, or choose a new table prefix before import.
-- No DROP/TRUNCATE: existing installations must not be reset by an upload.
SET NAMES utf8mb4;
CREATE TABLE PREFIX_state (
  state_key VARCHAR(32) PRIMARY KEY,
  payload LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE PREFIX_images (
  item_id BIGINT UNSIGNED PRIMARY KEY,
  content_type VARCHAR(32) NOT NULL,
  image_bytes MEDIUMBLOB NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE PREFIX_sessions (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  username VARCHAR(80) NOT NULL,
  expires_at BIGINT NOT NULL,
  KEY session_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE PREFIX_login_limits (
  client_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  failures INT NOT NULL DEFAULT 0,
  window_start BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
