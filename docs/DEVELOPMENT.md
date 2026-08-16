# 开发指南

## 代码边界

- `server/src/*` 按 NestJS feature module 组织；Controller 负责 HTTP 参数，Service 负责 Prisma 查询和业务规则。
- `server/prisma/schema.prisma` 是数据库模型唯一来源；结构变更必须提交新的 `prisma/migrations/*/migration.sql`。
- `miniapp/src/api` 和 `web/src/api` 是客户端 API 适配层，页面不应直接拼接请求。
- 所有 API 成功返回 `{ code, data, message }`，由客户端拦截器解包 `data`。

## 开发流程

1. 修改 Prisma schema 后运行 `cd server; npm run prisma:generate`。
2. 本地开发使用 `npm run prisma:migrate` 创建迁移，提交迁移目录。
3. 服务端执行 `npm run typecheck` 和 `npm test`。
4. Web 执行 `npm run check`；小程序执行 `npm run check` 并用微信开发者工具验证页面。
5. 需要新增接口时同步更新 [API.md](API.md) 和对应的 `web/src/api`、`miniapp/src/api`。

## 测试

当前测试重点覆盖不依赖数据库的提醒日期计算，测试文件位于 `server/test`。完整接口测试需要 MySQL、微信登录模拟和独立测试数据，部署前应补充集成测试。

## 环境变量

服务端读取 `server/.env`，也兼容项目根目录 `.env`。模板见 `server/.env.example`。Web 和小程序分别使用 `web/.env.local`、`miniapp/.env.local`；这些文件不应提交。
