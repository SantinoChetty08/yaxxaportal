CREATE DATABASE IF NOT EXISTS yaxxa_portal_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'portal_auth'@'localhost'
  IDENTIFIED BY 'REPLACE_WITH_STRONG_DB_PASSWORD';

GRANT ALL PRIVILEGES ON yaxxa_portal_auth.* TO 'portal_auth'@'localhost';
FLUSH PRIVILEGES;
