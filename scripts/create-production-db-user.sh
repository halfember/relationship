#!/bin/sh
set -eu

cd /opt/relationship-manager
root_client=/opt/relationship-manager/.mysql-root.cnf
trap 'rm -f "$root_client"' EXIT
set -a
. ./.env
set +a
umask 077
printf '[client]\nuser=root\npassword=%s\nsocket=/var/lib/mysql/mysql.sock\n' "$MYSQL_ROOT_PASSWORD" > "$root_client"
unset MYSQL_ROOT_PASSWORD

app_url=$(sed -n 's/^DATABASE_URL="\(.*\)"$/\1/p' server/.env)
app_password=${app_url#mysql://relationship_app:}
app_password=${app_password%@127.0.0.1:3306/relationship}

mysql --defaults-extra-file="$root_client" <<SQL
CREATE USER IF NOT EXISTS 'relationship_app'@'127.0.0.1' IDENTIFIED BY '${app_password}';
ALTER USER 'relationship_app'@'127.0.0.1' IDENTIFIED BY '${app_password}';
GRANT ALL PRIVILEGES ON relationship.* TO 'relationship_app'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

unset app_password app_url
