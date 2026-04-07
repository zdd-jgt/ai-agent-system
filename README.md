# AI Agent 自动任务执行系统

* 确定项目方向：`AI Agent 自动任务执行系统`
* 确定技术栈：前端 `React`，后端 `Node.js`
* 大模型：`DeepSeek`

## 项目路线

### 第 1 阶段：环境与项目骨架

目标：把项目跑起来，前后端分开，基础目录结构搭好。

### 第 2 阶段：最小可用 Agent

目标：用户输入一个任务，后端调用 DeepSeek 生成执行计划，并返回结果。

### 第 3 阶段：工具调用能力

目标：Agent 可以调用本地工具，比如：

* 查询时间
* 读写文件
* 调接口
* 搜索网页
* 执行简单自动化

### 第 4 阶段：任务拆解与执行引擎

目标：把一个大任务拆成多个子任务，支持顺序执行、失败重试、状态保存。

### 第 5 阶段：前端任务看板

目标：React 页面展示：

* 任务创建
* 执行中状态
* 任务日志
* 步骤结果
* 失败原因

### 第 6 阶段：进阶能力

目标：加入：

* 记忆
* 任务队列
* 多 Agent 协作
* 定时执行
* 权限和部署

## 项目环境

* `Node.js 20+`
* `pnpm`
* `Git`
* DeepSeek API Key

## 项目结构

前后端分离的 monorepo：

```bash
ai-agent-system/
├── apps/
│   ├── web/        # React 前端
│   └── server/     # Node 后端
├── packages/
│   ├── shared/     # 公共类型、工具
│   └── config/     # 公共配置
├── docs/           # 设计文档
├── .env.example
└── package.json
```

---

## 技术选型

先用这一套，后面再加复杂能力：

### 前端

* React
* Vite
* TypeScript
* Tailwind CSS
* Zustand（状态管理，后面再加）

### 后端

* Node.js
* Express
* TypeScript
* Zod（参数校验）
* dotenv（环境变量）
* OpenAI SDK / DeepSeek 兼容调用方式

### 后续增强

* Prisma + PostgreSQL：任务存储
* Redis + BullMQ：任务队列
* Playwright：浏览器自动化
* SSE / WebSocket：实时日志推送
