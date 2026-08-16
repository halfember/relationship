#!/bin/sh
set -eu

id relationship >/dev/null 2>&1 || \
  useradd --system --home-dir /opt/relationship-manager --shell /sbin/nologin relationship

install -d -o relationship -g relationship -m 750 /opt/relationship-manager/data/uploads
chown -R relationship:relationship \
  /opt/relationship-manager/server/dist \
  /opt/relationship-manager/server/node_modules \
  /opt/relationship-manager/server/prisma
chmod 600 /opt/relationship-manager/server/.env

systemctl daemon-reload
systemctl enable relationship-manager.service

cd /opt/relationship-manager
docker compose config --quiet
docker compose up -d
systemctl restart relationship-manager.service
sleep 8

echo SYSTEMD
systemctl is-active relationship-manager.service
echo COMPOSE
docker compose ps
echo HEALTH
curl -fsS http://127.0.0.1:3000/api/health
echo PORTS
ss -lntup | grep -E ':(80|443|3000|3306|33060|6379) '
echo CADDY_LOGS
docker logs --tail 80 relationship-caddy
