#!/bin/sh
set -eu

cd /opt/relationship-manager
client_config=/opt/relationship-manager/.mysql-client.cnf
trap 'rm -f "$client_config"' EXIT
set -a
. ./.env
set +a

mysql -uroot <<SQL
CREATE DATABASE IF NOT EXISTS relationship
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';
FLUSH PRIVILEGES;
SQL

umask 077
printf '[client]\nuser=root\npassword=%s\nhost=127.0.0.1\n' "$MYSQL_ROOT_PASSWORD" > "$client_config"
unset MYSQL_ROOT_PASSWORD
mysqladmin --defaults-extra-file="$client_config" ping --silent
