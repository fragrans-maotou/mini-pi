# 路线图

整体思路：**先让模型说话 → 再让它说同一种语言 → 再让它动手 → 再让它记得住、装得下。**

```
01 调一次模型  ─┐
02 流式输出     ├─ 第一阶段：和模型对话（packages/ai）
03 统一消息类型 │
04 provider 注册表┘
05 定义工具     ─┐
06 Agent 循环    ├─ 第二阶段：让模型动手（packages/agent）  ← 最重要
07 事件与钩子   ─┘
08 内置工具     ─┐
09 会话 JSONL    ├─ 第三阶段：变成真能用的工具（packages/cli）
10 上下文压缩   ─┘
11 生图工具      ── 加分：接到你的 AI 漫画流程
```

| # | 学什么 | 改哪些文件 | 怎么验证 |
|---|---|---|---|
| 01 | 一次 HTTP 请求就是“调模型” | `packages/ai/src/chat.ts`（已写好） | `npm run step1` |
| 02 | SSE 怎么一块块到达、怎么拼 | `packages/ai/src/sse.ts`、`stream.ts`（已写好） | `npm run step2`、`npm test` |
| 03 | 为什么要一套自己的消息格式 | `packages/ai/src/convert.ts` | `npm run verify -- 03` |
| 04 | 怎么做到“换模型不改 agent” | `packages/ai/src/registry.ts`、`providers/openai-completions.ts` | `npm run verify -- 04` |
| 05 | 工具 = 描述 + 执行；错误要喂回模型 | `packages/agent/src/tools.ts` | `npm run verify -- 05` |
| 06 | 双层 while 循环 | `packages/agent/src/agent-loop.ts` | `npm run verify -- 06` |
| 07 | 用事件解耦 UI；用钩子做权限 | `agent-loop.ts`、`agent.ts` | `npm run verify -- 07` |
| 08 | 真实工具的安全与截断 | `packages/cli/src/tools/*.ts` | `npm run verify -- 08`、`npm run chat` |
| 09 | append-only 日志、可恢复 | `packages/cli/src/session.ts`、`main.ts` | `npm run verify -- 09` |
| 10 | 上下文窗口是有限的 | `packages/cli/src/compaction.ts`、`session.ts` | `npm run verify -- 10` |
| 11 | 任何 API 都能变成工具 | `packages/cli/src/tools/image.ts` | `npm run verify -- 11` |

建议节奏：一天一步，第 6 步可以多花点时间。每步写完 `npm run typecheck && npm run verify -- NN`，然后 commit。
