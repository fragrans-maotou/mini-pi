# 06 Agent 循环（核心！）

## 学什么
**agent = 一个 while 循环。** 就这么简单：
```
用户说话 → 调模型
  模型要调工具？ → 执行 → 把结果加进对话 → 再调模型 → ……
  模型不调工具了？ → 结束
```
pi 用了**双层循环**：
- 内层：模型 ⇄ 工具，直到模型不再调工具
- 外层：内层结束后，看看用户有没有在等待期间又发了新消息（follow-up），有就接着跑

## 对应 pi 的哪个文件
- [`packages/agent/src/agent-loop.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/agent/src/agent-loop.ts) —— 搜 `// Outer loop` 和 `// Inner loop`（`runLoop` 函数），这是全 pi 最值得读的 100 行
- 读的时候先忽略 steering、prepareNextTurn、parallel 这些，只看主干

## 你要写的代码
`packages/agent/src/agent-loop.ts` 的 `runAgentLoop()`，文件里有伪代码。要点：
- 用 `config.streamFn(model, context)` 调模型，转发 `text_delta` 事件
- `context.tools` 用第 5 步的 `toToolDefinitions`
- 模型返回 `error` / `aborted` 时结束
- `maxTurns`（默认 20）
- 返回这次新产生的所有消息

## 怎么验证（完全离线，用假模型）
```bash
npm run verify -- 06
```
测试用 `createFakeModel([fakeToolCall(...), fakeText(...)])` 写“剧本”，看 `packages/ai/src/providers/fake.ts`。

## 思考题
- 模型一次返回了 3 个 toolCall，应该串行还是并行执行？pi 怎么选？（搜 `toolExecution`）
- 如果某个工具执行要 10 分钟，循环该怎么办？
- 为什么模型出错时要“结束循环并返回消息”，而不是 throw？
