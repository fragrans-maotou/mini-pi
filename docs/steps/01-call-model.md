# 01 调一次模型 ✅（已实现）

## 学什么
“调用大模型”听起来很玄，其实就是**一个 POST 请求**：把对话（messages 数组）发给 `/chat/completions`，拿回一段 JSON，从 `choices[0].message.content` 里取出回答。模型本身**没有记忆**——每次都要把完整对话发过去。

## 对应 pi 的哪个文件
- [`packages/ai/src/api/openai-completions.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/api/openai-completions.ts) —— pi 的 OpenAI 兼容实现（它直接用流式，比这里复杂很多，先别细看，只看 `stream` 函数里怎么组装 `params`）
- [`packages/ai/src/env-api-keys.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/env-api-keys.ts) —— pi 怎么从环境变量找 key

## 代码
已写好，读一遍就行：
- `packages/ai/src/env.ts`：读 `.env`，缺配置时给中文提示
- `packages/ai/src/chat.ts`：`chatCompletion()`、`postJson()`
- `packages/cli/src/step01.ts`：入口

## 怎么验证
```bash
cp .env.example .env   # 填好三个变量
npm run step1 -- "1+1 等于几？"
```
没填 key 时会看到“⚠️ 缺少配置……”，这是正常的。

## 小练习（可选）
1. 在 step01.ts 里把上一轮的回答也放进 messages，问一个追问，体会“模型没有记忆”。
2. 打印 `result.raw`，看看完整返回长什么样。

## 思考题
- `system` 消息和 `user` 消息有什么区别？放在最前面和放在中间效果一样吗？
- 如果对话越来越长，每次请求会发生什么？（第 10 步会回答）
