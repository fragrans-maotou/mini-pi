// 第 10 步（TODO）：上下文压缩。
// 对应 pi：packages/coding-agent/src/core/compaction/compaction.ts
// 思路：对话太长 → 把“旧的部分”交给模型写一段摘要 → 以后只发 [摘要 + 最近几轮]。
import type { Message, Model, StreamFunction } from "@mini-pi/ai";

/** TODO(step10): 粗略估算 token 数（pi 用 字符数/4 这种近似，见 packages/ai/src/utils/estimate.ts） */
export function estimateTokens(messages: Message[]): number {
  throw new Error("TODO(step10): 实现 estimateTokens");
}

/** TODO(step10): 超过 contextWindow - reserveTokens 就该压缩了 */
export function shouldCompact(messages: Message[], contextWindow: number, reserveTokens = 4000): boolean {
  throw new Error("TODO(step10): 实现 shouldCompact");
}

/**
 * TODO(step10): 找切分点：从后往前累加，保留最近约 keepRecentTokens 的消息。
 * 规则：切分点必须落在 user 消息上（不能把 assistant 的 toolCall 和对应的 toolResult 拆开！）
 * 返回“保留部分”的起始下标。
 */
export function findCutPoint(messages: Message[], keepRecentTokens: number): number {
  throw new Error("TODO(step10): 实现 findCutPoint");
}

/** TODO(step10): 调模型把 messages 总结成一段中文摘要（目标、做过的事、关键文件、下一步） */
export async function summarize(messages: Message[], model: Model, streamFn: StreamFunction): Promise<string> {
  throw new Error("TODO(step10): 实现 summarize");
}
