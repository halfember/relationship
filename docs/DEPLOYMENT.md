# Linux Deployment

Production uses the repository's existing deployment layout: MySQL 8 runs on the host at `127.0.0.1:3306`; Redis and Caddy run in Docker Compose; systemd runs the NestJS API as the `relationship` user on `127.0.0.1:3000`; and Caddy proxies `/api/*` over HTTPS.

Do not expose ports `3000`, `3306`, or `6379` publicly. Permit only SSH, HTTP, and HTTPS through the host firewall.

## Prerequisites

Use a systemd-based Linux distribution such as Ubuntu 22.04+. Install Node.js 20, Docker Engine with the Compose plugin, MySQL 8 server/client, curl, and tar. The scripts require `node`, `npm`, `mysql`, `mysqldump`, `docker`, `docker compose`, `systemctl`, and `curl`.

Set the public API domain in `Caddyfile` before deployment. DNS must point to this host, ports 80 and 443 must be reachable, and the domain must match `PUBLIC_BASE_URL`.

## Production Configuration

```bash
sudo install -d -m 0755 /opt/relationship-manager/{releases,backups,data/uploads}
sudo install -d -m 0700 /opt/relationship-manager/backups
sudo cp docker-compose.yml Caddyfile /opt/relationship-manager/
sudo cp scripts/mysql-production.cnf /etc/mysql/mysql.conf.d/relationship-manager.cnf
sudo systemctl restart mysql

sudo tee /opt/relationship-manager/.env >/dev/null <<'EOF'
MYSQL_ROOT_PASSWORD="replace-with-the-local-mysql-root-password"
MYSQL_DATABASE="relationship"
EOF
sudo chmod 600 /opt/relationship-manager/.env
```

Create `/opt/relationship-manager/server.env` with mode `600`. It is copied into
the first release below. The `DATABASE_URL` password is for a dedicated MySQL
user and must URL-encode reserved characters.

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
DATABASE_URL="mysql://relationship_app:replace-with-url-encoded-password@127.0.0.1:3306/relationship"
REDIS_URL="redis://127.0.0.1:6379"
PUBLIC_BASE_URL="https://api.example.com"
CORS_ORIGIN="https://web.example.com"
AUTH_SECRET="at-least-32-random-characters"
WECHAT_APPID="wx..."
WECHAT_SECRET="..."
WECHAT_REMINDER_TEMPLATE_ID="..."
UPLOAD_DIR="/opt/relationship-manager/data/uploads"
AI_API_URL="https://api.openai.com/v1"
AI_API_KEY="..."
AI_MODEL="gpt-4o-mini"
AI_TIMEOUT_MS=12000
```

`WECHAT_APPID`, `WECHAT_SECRET`, `WECHAT_REMINDER_TEMPLATE_ID`, `AUTH_SECRET`, `PUBLIC_BASE_URL`, and `CORS_ORIGIN` are mandatory in production. The API refuses to start when they are missing. Do not commit either `.env` file.

## First Deployment

Build a source release archive from the repository root. It excludes local dependencies, build output, data, and secrets.

```bash
version=1.4.3
tar -C server --exclude=node_modules --exclude=dist --exclude=.env --exclude=data --exclude=.npm --exclude='*.tsbuildinfo' -czf "relationship-manager-server-${version}.tar.gz" .
```

Copy the archive and the repository `scripts/` directory to the server. On the server, unpack the initial release and make it current:

```bash
version=1.4.3
release="/opt/relationship-manager/releases/${version}-initial"
sudo install -d -m 0755 "$release"
sudo tar -xzf "relationship-manager-server-${version}.tar.gz" -C "$release"
sudo cp /opt/relationship-manager/server.env "$release/.env"
sudo ln -sfn "$release" /opt/relationship-manager/server

sudo cp scripts/relationship-manager.service /etc/systemd/system/
sudo cp scripts/init-production-mysql.sh scripts/create-production-db-user.sh /opt/relationship-manager/
sudo chmod 700 /opt/relationship-manager/*.sh
sudo useradd --system --home-dir /opt/relationship-manager --shell /usr/sbin/nologin relationship 2>/dev/null || true
sudo chown -R relationship:relationship /opt/relationship-manager/data/uploads
sudo /opt/relationship-manager/init-production-mysql.sh
sudo /opt/relationship-manager/create-production-db-user.sh

cd /opt/relationship-manager/server
sudo npm ci
sudo npx prisma generate
sudo npx prisma migrate deploy
sudo npm run build
sudo npm prune --omit=dev

sudo docker compose -f /opt/relationship-manager/docker-compose.yml up -d
sudo systemctl daemon-reload
sudo systemctl enable --now relationship-manager.service
curl -fsS http://127.0.0.1:3000/api/health
```

Before starting Caddy, replace the domain in `/opt/relationship-manager/Caddyfile`. Validate it with `sudo docker compose -f /opt/relationship-manager/docker-compose.yml config --quiet`.

## Releases And Rollback

For subsequent releases, copy the archive to the server and run the existing release script. It backs up MySQL, runs checks, applies migrations, switches the release symlink, restarts systemd, and verifies health.

```bash
sudo /path/to/scripts/deploy-linux.sh /path/to/relationship-manager-server-1.4.3.tar.gz 1.4.3
```

Keep `backup-mysql.js` next to `deploy-linux.sh`; the script uses it to create the database backup. To restore the previous healthy release, run:

```bash
sudo /path/to/scripts/rollback-latest-linux.sh
```

## Verification

```bash
curl -fsS https://api.example.com/api/health
sudo systemctl status relationship-manager.service --no-pager
sudo journalctl -u relationship-manager.service -n 100 --no-pager
sudo docker compose -f /opt/relationship-manager/docker-compose.yml ps
sudo docker logs --tail 100 relationship-caddy
```

Deployment backups are stored at `/opt/relationship-manager/backups/<timestamp>/database.sql`. Copy them to encrypted off-host storage; a single server disk is not a backup strategy.

## Troubleshooting

| Symptom | Check | Resolution |
| --- | --- | --- |
| API returns 503 | `journalctl -u relationship-manager.service -n 100` | Check MySQL, `DATABASE_URL`, and migrations. |
| API fails at boot | `systemctl status relationship-manager.service` | Fill all mandatory variables and use an HTTPS `PUBLIC_BASE_URL`. |
| HTTPS certificate fails | `docker logs relationship-caddy` | Correct DNS, open ports 80/443, and make the Caddy domain match the API URL. |
| Upload fails | `ls -ld /opt/relationship-manager/data/uploads` | Ensure `relationship:relationship` owns the directory. |
