# 10 上下文压缩

## 学什么
模型的上下文窗口有限（比如 128k token）。聊久了、读了很多文件，就会超。
pi 的做法：快满时，把**旧的部分**交给模型写一段摘要，以后只发 **[摘要 + 最近几轮]**。原始记录仍在 JSONL 里，只是不再发给模型。
关键细节：切分点不能把 assistant 的 toolCall 和对应的 toolResult 拆开。

## 对应 pi 的哪个文件
- [`packages/coding-agent/src/core/compaction/compaction.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) —— 搜 `shouldCompact`、`findCutPoint`、`estimateTokens`
- [`packages/ai/src/utils/estimate.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/utils/estimate.ts)

## 你要写的代码
- `packages/cli/src/compaction.ts`
- `session.ts` 的 `appendCompaction`，以及 `buildMessages` 支持压缩记录
- `main.ts` 里每次 prompt 前检查

## 怎么验证
```bash
npm run verify -- 10
```
手动测试：把 contextWindow 临时设成很小（比如 3000），聊几轮看它自动压缩。

## 思考题
- 摘要 prompt 里应该要求模型保留哪些信息？（看看 pi 的 `SUMMARIZATION_PROMPT`）
- 压缩会丢信息。有哪些场景宁可报错也不该自动压缩？
