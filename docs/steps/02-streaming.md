# 02 流式输出（SSE）✅（已实现）

## 学什么
加上 `stream: true`，服务器会用 **SSE（Server-Sent Events）** 一点点地返回：
```
data: {"choices":[{"delta":{"content":"你"}}]}

data: {"choices":[{"delta":{"content":"好"}}]}

data: [DONE]
```
关键难点：网络传过来的“块”（chunk）和“行”不对齐，一行可能被切成两半，所以要**攒 buffer、遇到换行才处理、遇到空行才算一个事件结束**。
工具调用（tool_calls）的参数也是**一小段一小段**来的，要按 `index` 拼起来——第 5 步会用到。

## 对应 pi 的哪个文件
- [`packages/ai/src/api/openai-completions.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/api/openai-completions.ts) —— 搜 `for await`，看它怎么处理 `delta.content` 和 `delta.tool_calls`
- [`packages/ai/src/utils/event-stream.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/utils/event-stream.ts) —— pi 把流包装成一个可以 `for await` 的事件流

## 代码
已写好：
- `packages/ai/src/sse.ts`：`SSEParser`（纯函数，好测）+ `readSSE()`
- `packages/ai/src/stream.ts`：`streamChatCompletion()`、`parseChatStream()`
- `packages/cli/src/step02.ts`：入口，会打印首字延迟

## 怎么验证
```bash
npm test              # 离线测试 SSE 解析（一个字符一个字符地喂也能对）
npm run step2 -- "讲个短笑话"
```

## 思考题
- 为什么 `TextDecoder.decode` 要传 `{ stream: true }`？（提示：一个中文字是 3 个字节）
- 用户想中途按 Ctrl+C 停止生成，应该用什么？（提示：`AbortSignal`，第 7 步）
- 流式和非流式，总耗时差不多，为什么用户感觉流式快很多？
