# 04 provider 注册表

## 学什么
上层只想说一句：`stream(model, context)`。至于背后是 OpenAI、本地模型还是假模型，由 `model.api` 决定。
实现方法很朴素：一个 `Map<string, StreamFunction>`。这就是“插件化”的最小形态。

## 对应 pi 的哪个文件
- [`packages/ai/src/compat.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/compat.ts) —— 搜 `registerApiProvider`、`getApiProvider`、`export function stream`
- [`packages/ai/src/api/lazy.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/api/lazy.ts) —— pi 进阶技巧：provider 用到时才加载
- [`packages/ai/src/providers/`](https://github.com/fragrans-maotou/pi/tree/main/packages/ai/src/providers) —— 各家模型的配置

## 你要写的代码
1. `packages/ai/src/registry.ts`：`registerProvider` / `getProvider` / `stream` / `complete`
2. `packages/ai/src/providers/openai-completions.ts`：把第 2、3 步组合成一个 `StreamFunction`，文件末尾注册为 `"openai-completions"`
3. 注意：`complete()` 拿到 `error` 事件时也返回那条消息（不抛）

## 怎么验证
```bash
npm run verify -- 04
```
有 key 的话，自己写个小脚本用 `complete({ id: MODEL, api: "openai-completions", baseUrl, apiKey }, ...)` 调一次真模型。

## 思考题
- 现在要支持 Anthropic，需要改哪些文件？不需要改哪些？
- 为什么 fake provider 也走同一个注册表很重要？
