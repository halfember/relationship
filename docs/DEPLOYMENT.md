# 部署运维

## Docker Compose

1. 复制根目录 `.env.example` 为 `.env`，设置 `MYSQL_ROOT_PASSWORD`。
2. 复制 `server/.env.example` 为 `server/.env`，填写微信和 AI 配置。
3. ECS 当前采用宿主机 MySQL 与 Node.js API，Redis/Caddy 使用 Compose。安装依赖、构建 API 后启用 `relationship-manager.service`，再执行 `docker compose up -d`。
4. 等待 Caddy 自动申请证书后检查 `https://yumt.cn/api/health`。

### 发布数据库迁移

当前生产数据库在远程 Linux ECS 上，迁移必须在 ECS 上执行，不能使用本机的 `server/.env` 连接配置。发布新版本时：

```bash
cd /opt/relationship-manager/server
cp .env .env.backup-$(date +%F-%H%M%S)
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
sudo systemctl restart relationship-manager
curl -fsS https://yumt.cn/api/health
```

确认输出包含 `20260816000000_add_contact_connections` 和 `20260816020000_add_reminder_delivery` 后，再发布小程序构建产物。若 API 使用 Docker 镜像，重新构建并启动容器即可，镜像入口会自动执行 `npx prisma migrate deploy`；当前根目录 Compose 不包含 API 服务。

如果历史数据库尚未使用 Prisma（没有 `_prisma_migrations` 表），首次切换前必须先完成一次基线：确认现有结构与 `20260811000000_init` 一致，创建备份后执行 `npx prisma migrate resolve --applied 20260811000000_init`，再执行 `npx prisma migrate deploy`。不要把后续迁移直接标记为已应用，也不要跳过备份；迁移包含索引、外键和提醒数据清理。

Docker 镜像以非 root 用户运行，入口通过已安装的 Prisma CLI 文件执行迁移，不能使用会尝试写入 `node_modules` 的 `npx prisma migrate deploy`。上传目录必须挂载到持久化卷 `/app/data/uploads`，否则替换容器会丢失图片。

生产环境的 `server/.env` 至少需要：

```env
NODE_ENV=production
WECHAT_APPID=wx实际小程序AppID
WECHAT_SECRET=微信小程序Secret
WECHAT_REMINDER_TEMPLATE_ID=TNDeCEq2sRHrJrbw_ZloWQfqlRNOyjXBfuwsWEySDp8
AUTH_SECRET=至少32位的随机字符串
PUBLIC_BASE_URL=https://api.example.com
CORS_ORIGIN=https://admin.example.com
```

`WECHAT_APPID` 必须与 `miniapp/src/manifest.json` 中的 AppID 一致。缺少上述关键配置时 API 会拒绝启动。

API 容器启动命令会先执行 `npx prisma migrate deploy`，因此只会应用已提交的迁移，不会在生产环境修改 schema。

## 反向代理

生产环境应在 Nginx、Caddy 或云负载均衡后提供 HTTPS，并将 `/api` 反代到 `server:3000`。微信小程序要求业务域名使用 HTTPS，不能直接使用 IP 和 HTTP。

服务端设置：

```env
NODE_ENV=production
CORS_ORIGIN=https://admin.example.com
```

多个来源用逗号分隔。不要在生产环境保留空的 `CORS_ORIGIN`。

## 小程序发布

1. 确保 `yumt.cn` 解析到服务器，并在云安全组和系统防火墙放行 TCP 80、TCP 443 和 UDP 443。Compose 内置 Caddy，会自动申请 HTTPS 证书并把 `/api` 反代到服务端。
2. 在微信公众平台的“开发管理 > 开发设置 > 服务器域名”中，把 `https://yumt.cn` 同时加入 `request`、`uploadFile` 和 `downloadFile` 合法域名。
3. 从 `miniapp/.env.production.example` 创建 `miniapp/.env.production`，填写同一 API 地址（需要包含 `/api`）和 `VITE_WECHAT_REMINDER_TEMPLATE_ID`。
4. 在 `miniapp` 目录执行 `npm run build:mp-weixin`。
5. 微信开发者工具导入 `miniapp/dist/build/mp-weixin`，完成真机预览、体验版验证、上传、提交审核和发布。

### 订阅提醒上线验收

1. 在真实手机创建带提醒的生日或纪念日，并在微信弹窗中选择允许。
2. 在测试数据中把对应 `Reminder.remindDate` 调整为当天，等待十分钟调度或从受控调试入口触发发送。
3. 确认微信收到模板 2983 消息，字段分别为事项主题、事项时间和事项描述。
4. 点击消息，确认私人提醒进入关系详情，共同空间提醒进入空间详情。
5. 确认数据库 `delivery_status=SENT`、`sent=true`、`sent_at` 非空。
6. 再用拒绝授权场景验证业务数据仍保存，发送后状态为 `NO_PERMISSION`，且不会显示为已送达。

微信订阅消息授权按次消耗，不能把一次允许理解为永久订阅。服务端在北京时间 09:00-20:50 每 10 分钟处理当日提醒，临时故障最多尝试 5 次。

本项目会在生产构建时校验 API 必须使用 HTTPS，避免把本机地址上传。回忆图片保存在 `upload_data` Docker volume；单实例可直接使用，多实例部署应改用对象存储。

## 数据备份

当前 ECS 的 MySQL 运行在宿主机，连接信息由 `server/.env` 的 `DATABASE_URL` 提供。
至少每日执行一次逻辑备份，并在升级迁移前创建快照。项目内的备份工具不会输出数据库密码，
并使用 `--single-transaction` 与 `--no-tablespaces`：

```bash
node scripts/backup-mysql.js server/.env backups/relationship-$(date +%F-%H%M%S).sql
```

不要把备份文件、`.env`、上传音频或 AI 记录提交到代码仓库。

## 回滚

应用回滚可以回退镜像版本；数据库迁移不提供自动 down migration。需要回滚 schema 时先从备份恢复，再部署兼容版本。
