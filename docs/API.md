# API 接口

API 前缀为 `/api`，默认地址为 `http://localhost:3000/api`。

## 响应格式

成功响应：

```json
{ "code": 0, "data": {}, "message": "ok" }
```

失败响应使用 HTTP 状态码，并保持相同结构：

```json
{ "code": 400, "data": null, "message": "参数校验失败" }
```

除登录和邀请预览等公开接口外，业务接口必须发送 `Authorization: Bearer <accessToken>`。服务端从令牌主体读取当前用户；兼容接口中的 `userId` 参数也必须与令牌主体一致。

## 系统与用户

| 方法 | 路径 | 参数 | 说明 |
| --- | --- | --- | --- |
| GET | `/` | - | API 服务信息 |
| GET | `/health` | - | 数据库、内存和运行状态；数据库异常时 HTTP 503 |
| POST | `/user/login` | `code`, `nickname?`, `avatar?` | 微信登录/注册 |
| POST | `/user/desktop-code` | - | 为当前用户生成 8 位桌面连接码，5 分钟有效 |
| POST | `/user/desktop-login` | `code` | 使用连接码登录桌面版；公开接口，连接码只能使用一次 |
| GET | `/user/:id` | - | 用户详情 |
| PUT | `/user/:id` | `nickname?`, `avatar?` | 更新资料；客户端不可修改 VIP 等级 |
| GET | `/user/:id/stats` | - | 用户统计 |

## 关系、事件和回忆

| 方法 | 路径 | 参数 | 说明 |
| --- | --- | --- | --- |
| POST | `/relationship/create` | `userId`, `name`, `type`, `avatar?`, `birthday?`, `tags?`, `remark?` | 创建关系 |
| GET | `/relationship/list` | `userId` | 关系列表 |
| GET | `/relationship/:id` | - | 详情，含事件和最近回忆 |
| PUT | `/relationship/:id` | 关系字段（均可选） | 更新关系 |
| DELETE | `/relationship/:id` | - | 删除关系及其事件、回忆 |
| POST | `/event/create` | `relationshipId`, `title`, `eventDate`, `repeatType?`, `remindDays?` | 创建事件 |
| GET | `/event/upcoming` | `days?` | 直接按个人及共同空间事件计算未来发生日，`days` 默认为 90、范围为 1-365 |
| GET | `/event/all` | - | 当前用户的全部个人事件，包含 `relationshipName` |
| GET | `/event/list` | `relationshipId` | 事件列表 |
| GET | `/event/:id` | - | 事件详情 |
| PUT | `/event/:id` | 事件字段（均可选） | 更新事件 |
| DELETE | `/event/:id` | - | 删除事件 |
| POST | `/memory/create` | `relationshipId`, `imageUrl?`, `content?`, `memoryDate?` | 创建回忆 |
| GET | `/memory/all` | - | 当前用户的全部个人回忆，包含 `relationshipName` |
| GET | `/memory/list` | `relationshipId` | 回忆列表 |
| GET | `/memory/:id` | - | 回忆详情 |
| PUT | `/memory/:id` | 回忆字段（均可选） | 更新回忆 |
| DELETE | `/memory/:id` | - | 删除回忆 |

`repeatType` 支持 `每年`、`每月`、`每周`。`remindDays` 是提前天数数组，范围为 0-365。

## AI、提醒和统计

| 方法 | 路径 | 参数 | 说明 |
| --- | --- | --- | --- |
| POST | `/ai/generate` | `userId`, `type`, `prompt`, `relationshipId?` | `type` 为 `blessing`/`memory`/`gift` |
| GET | `/ai/records` | `userId`, `page?`, `pageSize?` | AI 调用记录 |
| GET | `/reminder/upcoming` | `userId`, `days?` | 未来提醒，`days` 1-90 |
| GET | `/reminder/today` | `userId` | 今日提醒 |
| POST | `/reminder/generate` | - | 手动生成未来 30 天提醒 |
| POST | `/reminder/:id/acknowledge` | - | 标记当前用户已处理，不改变微信送达状态 |
| GET | `/analytics/dashboard` | `userId` | 总览、类型统计和关系图谱 |
| GET | `/analytics/activity` | `userId` | 最近 6 个月活动 |
| POST | `/analytics/events` | `eventName`, `page?`, `sessionId?`, `metadata?` | 记录当前用户的产品事件；单用户限流 120 次/分钟 |

定时任务每天凌晨 1 点生成未来 30 天提醒，并在北京时间 09:00-20:50 每 10 分钟发送当日到期的微信订阅消息。模板 2983“待办事项提醒”字段固定映射为：`thing1` 事项主题、`time2` 事项时间、`thing4` 事项描述。发送状态包括 `PENDING`、`SENDING`、`RETRY`、`SENT`、`NO_PERMISSION` 和 `FAILED`；只有微信接口返回 `errcode=0` 才写入 `SENT`。

临时错误按退避时间重试，最多尝试 5 次；`43101` 表示用户未授权或可发送次数已用完，记录为 `NO_PERMISSION`。微信订阅消息是一次性授权，用户在创建生日或纪念日时每接受一次授权，才增加一次该模板的可发送机会。生产环境需确保容器时区为 `Asia/Shanghai`。

`/analytics/events` 的 `eventName` 使用小写字母、数字和下划线，长度为 2-64；`sessionId` 长度为 8-64。`metadata` 仅允许字符串、数字、布尔值或 `null`，不得上传姓名、回忆正文、AI 提示词、AI 生成内容等隐私数据。

## 共享、语音和导出

| 方法 | 路径 | 参数 | 说明 |
| --- | --- | --- | --- |
| POST | `/contact/invites` | `displayName`, `relationshipType`, `message?` | 生成联系人邀请，不创建共同空间 |
| GET | `/contact/invites/sent` | - | 当前用户发出的待处理邀请 |
| DELETE | `/contact/invites/:id` | - | 撤回待处理邀请 |
| GET | `/contact/invites/:token` | - | 公开查看联系人邀请 |
| POST | `/contact/invites/accept` | `token`, `displayName?`, `relationshipType?` | 接受邀请并建立联系人连接 |
| POST | `/contact/invites/reject` | `token` | 拒绝联系人邀请 |
| GET | `/contact/connections` | - | 当前用户的联系人连接 |
| GET | `/contact/connections/:id` | - | 联系人连接详情 |
| DELETE | `/contact/connections/:id` | - | 解除联系人连接；已有共同空间时需先退出空间 |
| POST | `/voice/transcribe` | multipart `file` | 最大 10 MB；上游不可用时返回 502/503/504，不返回示例文本 |
| POST | `/upload/image` | multipart `file` | 最大 5 MB，支持 JPG/PNG/WebP |
| GET | `/export/relationship/:id` | 无 | 单条关系卡片数据 |
| GET | `/export/all` | 无 | 全部关系摘要 |

旧 `/share/*` 六位关系分享接口已从运行时下线，由联系人邀请和共同空间邀请替代。
