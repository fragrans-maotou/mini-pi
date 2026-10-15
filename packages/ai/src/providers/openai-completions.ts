// 第 4 步（TODO）：把第 2 步的流式代码包装成一个“标准 provider”。
// 对应 pi：packages/ai/src/api/openai-completions.ts 的 stream / streamSimple
import type { AssistantMessageEvent, Context, Model, StreamOptions } from "../types.ts";

/**
 * TODO(step04): 实现 StreamFunction：
 *  1. 用 toOpenAIMessages(context) / toOpenAITools(context.tools) 组装请求
 *  2. 调 streamChatCompletion（extraBody 里放 tools）
 *  3. text_delta → { type: "text_delta" }，tool_call_delta → { type: "toolcall_delta" }
 *  4. done → 用 toAssistantMessage 组装，yield { type: "done", message }
 *  5. 出错时不要 throw，而是 yield { type: "error", message: { stopReason: "error", errorMessage } }
 *     （pi 的约定：错误也是一条消息，这样 agent 循环可以优雅地结束）
 * 写完后在文件末尾 registerProvider("openai-completions", streamOpenAICompletions)
 */
export async function* streamOpenAICompletions(
  model: Model,
  context: Context,
  options?: StreamOptions,
): AsyncGenerator<AssistantMessageEvent> {
  throw new Error("TODO(step04): 实现 streamOpenAICompletions");
}
