# 05 定义工具 + 模型调用工具

## 学什么
模型自己**不能执行任何东西**。它只能“说”：我想调用 `read`，参数是 `{"path":"a.txt"}`。真正执行的是我们的代码。
所以一个工具 = **描述**（name / description / JSON Schema，发给模型看）+ **execute**（我们自己跑）。
最重要的一个思想：**工具出错不要抛异常，要变成一条 `isError: true` 的结果喂回给模型**，让它自己改正。

## 对应 pi 的哪个文件
- [`packages/agent/src/types.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/agent/src/types.ts) —— 搜 `interface AgentTool`
- [`packages/agent/src/agent-loop.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/agent/src/agent-loop.ts) —— 搜 `prepareToolCall`、`executePreparedToolCall`
- [`packages/ai/src/utils/validation.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/utils/validation.ts) —— pi 的参数校验

## 你要写的代码
`packages/agent/src/tools.ts`：
- `toToolDefinitions(tools)`
- `validateArgs(tool, args)`
- `executeToolCall(tools, toolCall)` —— 永远返回 `ToolResultMessage`

## 怎么验证
```bash
npm run verify -- 05
```
有 key 的话：在一个小脚本里定义一个 `get_weather` 工具，用第 4 步的 `complete` 调模型，看它是否返回 `stopReason: "toolUse"`。

## 思考题
- `description` 写得好不好，对模型选工具影响有多大？试试写一个很烂的描述。
- 模型可能编造一个不存在的工具名或者乱填参数，你的代码怎么兜底？
