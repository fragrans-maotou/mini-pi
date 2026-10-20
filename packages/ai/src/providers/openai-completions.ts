// 第 4 步（TODO）：把第 2 步的流式代码包装成一个“标准 provider”。
// 对应 pi：packages/ai/src/api/openai-completions.ts 的 stream / streamSimple
import { toAssistantMessage, toOpenAIMessages, toOpenAITools } from "../convert.ts";
import { registerProvider } from "../registry.ts";
import { streamChatCompletion } from "../stream.ts";
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
  const config = {
    baseUrl: model.baseUrl,
    apiKey: model.apiKey,
    model: model.id,
  };
  const message = toOpenAIMessages(context);
  const extraBody = context.tools ? {
    tools: toOpenAITools(context.tools)
  } : {};

  try {
    for await (const event of streamChatCompletion(config, message, {
      ...options,
      extraBody,
    })) {
      switch (event.type) {
        case "text_delta": {
          yield { type: "text_delta", delta: event.delta };
          break;
        }
        case "tool_call_delta": {
          yield { type: "toolcall_delta", index: event.index, delta: event.argumentsDelta };
          break;
        }
        case "done": {
          yield {
            type: "done", message: toAssistantMessage(event.text, event.toolCalls, event.finishReason, model.id)
          }
          break;
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    yield {
      type: "error",
      message: {
        role: "assistant",
        content: [],
        stopReason: "error",
        errorMessage,
        model: model.id,
        timestamp: Date.now(),
      },
    };
  }
}

registerProvider("openai-completions", streamOpenAICompletions);
