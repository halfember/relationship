# 与你AI V1.4.3

与你AI用于记录联系人、纪念日和共同回忆，并提供提醒、AI 文案、关系共享、语音转写和关系总结卡片。项目包含微信小程序、Web 管理端和 NestJS API 服务。

## 技术栈

| 端 | 技术 |
| --- | --- |
| API | Node.js 20、NestJS 10、Prisma 5、MySQL 8 |
| 小程序 | uni-app、Vue 3、微信小程序 |
| Web | Vue 3、Vite、TypeScript、TDesign、ECharts |
| 基础设施 | Docker Compose、MySQL；Redis 服务已预留，当前业务代码未直接使用 |
| AI | OpenAI 兼容 Chat Completions / Whisper 接口；未配置或上游失败时返回明确错误，不生成模拟内容 |

## 目录

```text
server/       NestJS API、Prisma schema 和数据库迁移
miniapp/      uni-app 微信小程序源码
web/          Vue Web 管理端源码
docs/         API、开发和部署文档
docker-compose.yml
```

## 快速启动

### 1. 准备环境

- Node.js 20+
- Docker Desktop（推荐）或本机 MySQL 8
- 微信开发者工具（调试小程序时）

复制环境模板并填写实际配置：

```powershell
Copy-Item server/.env.example server/.env
Copy-Item web/.env.example web/.env.local
Copy-Item miniapp/.env.example miniapp/.env.local
```

`server/.env` 中的微信 Secret 和 AI Key 只应保存在本机或部署平台密钥管理中，不要提交到仓库。

### 2. 启动数据库

```powershell
docker compose up -d mysql redis
```

首次启动或 schema 发生变化时：

```powershell
cd server
npm install
npm run prisma:generate
npm run prisma:migrate:prod
```

### 3. 启动 API

```powershell
cd server
npm install
npm run start:dev
```

服务地址：`http://localhost:3000`，健康检查：`http://localhost:3000/api/health`。

### 4. 启动 Web

```powershell
cd web
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。开发服务器会把 `/api` 代理到 `http://localhost:3000`。

### 5. 启动微信小程序

模拟器：

```powershell
cd miniapp
npm install
npm run dev:mp-weixin
```

在微信开发者工具打开 `miniapp/dist/dev/mp-weixin`。真机调试时，把 `miniapp/.env.local` 的 `VITE_API_BASE_URL` 改成开发机局域网 IP，并在微信开发者工具中关闭域名校验或配置 HTTPS 合法域名。

## Docker 部署

先复制根目录 `.env.example` 为 `.env`，设置 MySQL 密码，再复制并填写 `server/.env`。启动全部服务：

```powershell
docker compose up -d --build
```

后端容器启动时会自动执行 `prisma migrate deploy`，迁移失败时不会启动 API。生产环境请使用 HTTPS、限制 `CORS_ORIGIN`，并将微信和 AI 密钥放到部署平台的 Secret 中。详细说明见 [部署文档](docs/DEPLOYMENT.md)。

## 功能模块

- 用户：微信 `code2Session` 登录、资料和统计
- 关系：关系 CRUD、标签、生日、备注
- 事件：纪念日、每年/每月/每周重复、提前提醒
- 回忆：文字、图片 URL 和日期
- AI：祝福语、纪念日文案、送礼建议、调用记录
- 提醒：定时生成未来 30 天提醒、微信订阅消息授权与送达、今日/近期查询、独立处理状态
- 共享：邀请码、接受/退出/移除共享、只读详情
- 联系人连接：独立的联系人邀请和双向联系人连接，可选升级为共同空间
- 语音：上传音频并调用 Whisper 兼容接口转写
- 导出：单条关系卡片数据和全部关系摘要
- Web：数据看板、关系、事件、回忆和提醒管理

接口清单见 [API 文档](docs/API.md)。

## 常用命令

```powershell
# server
npm run typecheck
npm test
npm run check

# web
npm run typecheck
npm run build

# miniapp
npm run build:mp-weixin
```

## 当前边界

小程序使用微信登录并由 API 签发短期访问令牌，业务资源按登录用户校验所有权。Web 管理端尚未实现管理员登录，因此不应直接暴露在公网；正式管理端需要另行接入管理员认证。安全检查清单见 [SECURITY.md](docs/SECURITY.md)。

## 文档

- [API 接口](docs/API.md)
- [本地开发](docs/DEVELOPMENT.md)
- [部署运维](docs/DEPLOYMENT.md)
- [安全清单](docs/SECURITY.md)
