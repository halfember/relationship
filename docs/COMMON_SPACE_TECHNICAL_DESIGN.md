# 与你AI共同空间技术方案

> 版本：V1.0  
> 对应产品设计：[COMMON_SPACE_UI_DESIGN.md](./COMMON_SPACE_UI_DESIGN.md)

## 1. 目标与边界

共同空间为双人协作和家庭协作提供统一的成员、邀请、共同纪念日和共同回忆能力。

设计边界：

- `Relationship` 仍是某个用户的私人关系记录。
- 私人称呼、关系类型、标签、备注、私人提醒和 AI 记录不会进入共同空间。
- 共同纪念日按每个已绑定空间成员生成独立提醒，不复用或公开任何私人提醒。
- 双人空间与家庭空间复用同一组空间表和权限逻辑。
- 旧 `share_tokens/shared_access` 接口继续保留，只用于兼容历史只读分享。
- 第一版不实现聊天、评论、动态流和复杂家谱推导。

## 2. 模块结构

```text
server/src/space
├─ dto/space.dto.ts       请求校验
├─ space-policy.ts        无状态权限和邀请规则
├─ space.service.ts       事务、成员鉴权、内容操作
├─ space.controller.ts    REST API
└─ space.module.ts

miniapp/src
├─ api/space.js
└─ pages/space
   ├─ list.vue
   ├─ invite-create.vue
   ├─ invite-accept.vue
   ├─ family-create.vue
   ├─ detail.vue
   ├─ members.vue
   ├─ member-create.vue
   ├─ event-create.vue
   ├─ memory-create.vue
   ├─ calendar.vue
   ├─ memories.vue
   └─ settings.vue
```

## 3. 数据模型

### SharedSpace

空间聚合根。

| 字段 | 说明 |
|---|---|
| `type` | `PAIR` 或 `FAMILY` |
| `status` | `PENDING`、`ACTIVE`、`ARCHIVED` |
| `createdById` | 创建者账号 |
| `name/avatar` | 双方或家庭共同可见的空间资料 |

### SpaceMember

同时表达已注册成员和家庭档案成员。

- `userId != null`：已经绑定与你AI账号。
- `userId == null`：只有家庭档案，稍后可通过定向邀请绑定。
- `role`：`OWNER`、`ADMIN`、`MEMBER`。
- `status`：`ACTIVE`、`LEFT`、`REMOVED`。
- `generation`：`ELDER`、`PEER`、`YOUNGER`。
- `relationLabel` 是当前家庭内的展示称谓，不做不可逆的亲属关系推导。

### SpaceInvite

邀请码默认 10 位，使用去除 `I/O/0/1` 的大写字符集，7 天有效。

- 普通邀请接受后创建新的 `SpaceMember`。
- `targetMemberId` 存在时，接受后将用户绑定到已有家庭档案。
- 状态包括 `PENDING/ACCEPTED/EXPIRED/REVOKED`。

### SharedEvent / SharedMemory

空间内的共同内容，均保存 `createdById`。普通成员只能删除自己发布的内容，创建者和管理员可以管理全部共同内容。

### Relationship.sharedSpaceId

用户自己的私人关系记录可以关联一个共同空间。双人邀请接受时，双方分别拥有自己的 `Relationship`，因此称呼、类型和备注互不影响。

## 4. REST API

除邀请预览外，所有接口要求 `Authorization: Bearer <token>`。当前用户只从令牌读取，客户端不传 `userId`。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/spaces` | 我的共同空间 |
| GET | `/api/spaces/:id` | 空间首页数据 |
| PUT | `/api/spaces/:id` | 修改空间资料 |
| POST | `/api/spaces/pair/invites` | 创建双人空间和邀请 |
| POST | `/api/spaces/families` | 创建家庭空间 |
| GET | `/api/spaces/invites/:token` | 公开读取最小邀请预览 |
| POST | `/api/spaces/invites/accept` | 接受邀请或绑定档案 |
| POST | `/api/spaces/:id/invites` | 为已有空间生成邀请 |
| DELETE | `/api/spaces/:id/invites/:inviteId` | 撤回邀请 |
| GET | `/api/spaces/:id/members` | 成员和档案列表 |
| POST | `/api/spaces/:id/members/profiles` | 添加家庭档案成员 |
| PUT | `/api/spaces/:id/members/:memberId` | 修改成员档案 |
| DELETE | `/api/spaces/:id/members/:memberId` | 移除成员 |
| GET/POST | `/api/spaces/:id/events` | 共同纪念日列表/创建 |
| DELETE | `/api/spaces/:id/events/:eventId` | 删除共同纪念日 |
| GET/POST | `/api/spaces/:id/memories` | 共同回忆列表/创建 |
| DELETE | `/api/spaces/:id/memories/:memoryId` | 删除共同回忆 |
| DELETE | `/api/spaces/:id/leave` | 退出空间 |
| DELETE | `/api/spaces/:id` | 创建者解散空间 |

成功响应继续由全局拦截器包装为：

```json
{
  "code": 0,
  "data": {},
  "message": "ok"
}
```

## 5. 权限规则

| 操作 | OWNER | ADMIN | MEMBER | 未登录 |
|---|---:|---:|---:|---:|
| 查看空间 | 是 | 是 | 是 | 否 |
| 创建共同内容 | 是 | 是 | 是 | 否 |
| 删除自己的内容 | 是 | 是 | 是 | 否 |
| 删除他人的内容 | 是 | 是 | 否 | 否 |
| 修改家庭空间资料 | 是 | 是 | 否 | 否 |
| 移除成员 | 是 | 是 | 否 | 否 |
| 解散空间 | 是 | 否 | 否 | 否 |
| 查看邀请预览 | 是 | 是 | 是 | 是 |

所有带 `spaceId` 的业务方法首先调用成员校验，归档空间对成员也不可继续访问。

## 6. 核心事务

### 创建双人邀请

一个事务内完成：

1. 创建 `PENDING` 双人空间。
2. 创建邀请人为 `OWNER` 成员。
3. 新建或关联邀请人的私人 `Relationship`。
4. 可选创建共同纪念日。
5. 创建 7 天有效邀请。

### 接受双人邀请

一个事务内完成：

1. 再次校验邀请状态和过期时间。
2. 防止相同两人重复创建有效双人空间。
3. 创建接受方成员。
4. 为接受方创建独立私人 `Relationship`。
5. 激活空间并将邀请标记为已接受。

### 接受家庭绑定邀请

不创建重复成员，而是用带 `userId IS NULL` 条件的原子更新，把接受账号写入
`targetMemberId` 指向的档案成员。即使同一档案存在多张尚未过期的邀请，也只有一个账号能绑定成功；
已经在该空间留下成员记录的账号不能改绑到另一份档案。

### 退出与解散

- 双人空间任意一方退出后空间归档，双方私人关系解除空间关联但不删除。
- 双人空间不开放通用移除成员操作，避免绕过双方退出即归档的规则。
- 家庭普通成员退出只更新自己的成员状态。
- 家庭创建者必须先转让或直接解散，不能普通退出。
- 解散使用软归档，避免立即物理删除共同内容。

## 7. 登录与微信分享

邀请路径格式：

```text
/pages/space/invite-accept?token=XXXXXXXXXX
```

邀请预览无需登录。用户点击接受但尚未登录时，小程序将 token 保存到 `pendingSpaceInviteToken`；微信快捷登录成功后重新打开同一邀请页，不丢失上下文。

分享按钮使用小程序 `open-type="share"` 和 `onShareAppMessage`，邀请码输入是分享卡无法打开时的备用路径。

## 8. 数据库迁移

迁移文件：

```text
server/prisma/migrations/20260814000000_add_shared_spaces/migration.sql
server/prisma/migrations/20260815000000_fix_shared_space_reminders/migration.sql
server/prisma/migrations/20260815010000_add_reminder_uniqueness/migration.sql
```

第二个迁移为提醒增加 `sourceType`、`sharedSpaceId` 和 `sharedEventId`，并把历史英文关系类型转换为
现有中文分类。旧提醒通过默认值 `RELATIONSHIP` 保持兼容。

部署顺序：

1. 备份数据库和当前后端构建。
2. 执行 `npm run prisma:migrate:prod`。
3. 执行 `npm run prisma:generate` 和 `npm run check`。
4. 构建并重启后端。
5. 验证 `/api/health` 和邀请预览接口。
6. 再发布包含新页面的小程序体验版。

该迁移只增加新表和 `relationships.shared_space_id` 可空列，不修改历史关系、事件、回忆和只读分享数据。

## 9. 后续扩展

- 增加 `FamilyRelation` 边表支持复杂家谱和称谓推导。
- 增加成员角色转让和管理员设置接口。
- 增加共同内容编辑、操作审计和分页。
- 增加对象存储清理策略，避免删除回忆后遗留图片。
