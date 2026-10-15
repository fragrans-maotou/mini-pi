# 03 统一消息类型

## 学什么
OpenAI、Anthropic、Google 的消息格式都不一样。如果 agent 直接用 OpenAI 格式，换个模型就得全改。
pi 的做法：**定义一套自己的消息类型**（`UserMessage` / `AssistantMessage` / `ToolResultMessage`），每个 provider 负责“翻译”。
注意 pi 的设计细节：assistant 的 `content` 是一个**数组**，里面可以混着 `text` 和 `toolCall`；工具结果是独立的 `toolResult` 角色。

## 对应 pi 的哪个文件
- [`packages/ai/src/types.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/types.ts) —— 搜 `interface AssistantMessage`、`interface ToolCall`、`interface Context`、`type StopReason`
- [`packages/ai/src/api/openai-completions.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/api/openai-completions.ts) —— 搜 `function convertMessages`

## 你要写的代码
- 类型已在 `packages/ai/src/types.ts` 写好，先读懂它
- 在 `packages/ai/src/convert.ts` 实现 4 个函数：
  - `toOpenAIMessages(context)`
  - `toOpenAITools(tools)`
  - `mapStopReason(finishReason)`
  - `toAssistantMessage(text, toolCalls, finishReason)`

## 怎么验证
```bash
npm run verify -- 03
```

## 思考题
- 为什么 `ToolCall.arguments` 存成对象，而 OpenAI 要字符串？在哪一层转换最合适？
- pi 的 `StopReason` 里有 `"error"` 和 `"aborted"`。把“出错”也表示成一条消息，而不是抛异常，有什么好处？
