// 第 3 步（TODO）：统一格式 <-> OpenAI 线上格式 的翻译。
// 对应 pi：packages/ai/src/api/openai-completions.ts 里的 convertMessages()
import type { OpenAIChatMessage, OpenAIToolCall } from "./chat.ts";
import type { AssistantMessage, Context, StopReason, Tool } from "./types.ts";

/**
 * TODO(step03): 把统一的 Context 翻译成 OpenAI 的 messages 数组。
 *  - systemPrompt → 开头一条 { role: "system" }
 *  - UserMessage → { role: "user", content }（content 是数组时把 text 拼起来）
 *  - AssistantMessage → { role: "assistant", content: 文本, tool_calls: [...] }
 *      注意：ToolCall.arguments 是对象，OpenAI 要的是 JSON 字符串
 *  - ToolResultMessage → { role: "tool", tool_call_id, content }
 */
export function toOpenAIMessages(context: Context): OpenAIChatMessage[] {
  throw new Error("TODO(step03): 实现 toOpenAIMessages");
}

/**
 * TODO(step03): 把 Tool[] 翻译成 OpenAI 的 tools 参数：
 *   [{ type: "function", function: { name, description, parameters } }]
 */
export function toOpenAITools(tools: Tool[]): unknown[] {
  throw new Error("TODO(step03): 实现 toOpenAITools");
}

/**
 * TODO(step03): OpenAI 的 finish_reason → 统一的 StopReason
 *   "stop" → "stop"，"length" → "length"，"tool_calls" → "toolUse"，其它 → "stop"
 */
export function mapStopReason(finishReason: string | null): StopReason {
  throw new Error("TODO(step03): 实现 mapStopReason");
}

/**
 * TODO(step03): 把第 2 步 parseChatStream 的 done 事件（text + toolCalls + finishReason）
 * 组装成一条 AssistantMessage。
 *   - 文本非空时放一个 TextContent
 *   - 每个 tool call 放一个 ToolCall，arguments 用 JSON.parse（解析失败给 {}）
 */
export function toAssistantMessage(
  text: string,
  toolCalls: OpenAIToolCall[],
  finishReason: string | null,
  model?: string,
): AssistantMessage {
  throw new Error("TODO(step03): 实现 toAssistantMessage");
}
