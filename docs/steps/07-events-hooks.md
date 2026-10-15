# 07 事件与钩子（beforeToolCall / afterToolCall）

## 学什么
循环写好后，各种需求都想往里塞：打印到终端、存到文件、问用户要不要执行……全塞进循环就乱了。
pi 的解法：
- **事件**：循环只负责 `emit({ type: "tool_execution_start", ... })`，谁关心谁订阅（UI、日志、会话保存）
- **钩子**：在关键位置留口子。`beforeToolCall` 能**拦截**（权限确认），`afterToolCall` 能**改写结果**（脱敏、审计）

## 对应 pi 的哪个文件
- [`packages/agent/src/types.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/agent/src/types.ts) —— 搜 `AgentEvent`
- [`packages/agent/src/agent-loop.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/agent/src/agent-loop.ts) —— 搜 `beforeToolCall`、`afterToolCall`
- [`packages/agent/src/agent.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/agent/src/agent.ts) —— `Agent` 类：`subscribe`、`prompt`、`abort`、`followUp`

## 你要写的代码
1. 在 `runAgentLoop` 里按顺序 emit 所有 `AgentEvent`，并接上两个钩子
2. 实现 `packages/agent/src/agent.ts` 的 `Agent` 类

## 怎么验证
```bash
npm run verify -- 07
```

## 思考题
- 为什么 `beforeToolCall` 拦截后，还要给模型返回一条结果，而不是直接跳过？
- 事件监听器里抛了异常，应该让整个 agent 崩掉吗？
