// 第 3 步（TODO）：统一格式 <-> OpenAI 线上格式 的翻译。
// 对应 pi：packages/ai/src/api/openai-completions.ts 里的 convertMessages()
import type { OpenAIChatMessage, OpenAIToolCall } from "./chat.ts";
import type { AssistantMessage, Context, StopReason, TextContent, Tool, ToolCall } from "./types.ts";

/**
 * TODO(step03): 把统一的 Context 翻译成 OpenAI 协议 的 messages 数组。
 *  - systemPrompt → 开头一条 { role: "system" }
 *  - UserMessage → { role: "user", content }（content 是数组时把 text 拼起来）
 *  - AssistantMessage → { role: "assistant", content: 文本, tool_calls: [...] }
 *      注意：ToolCall.arguments 是对象，OpenAI 要的是 JSON 字符串
 *  - ToolResultMessage → { role: "tool", tool_call_id, content }
 */
export function toOpenAIMessages(context: Context): OpenAIChatMessage[] {
  const messages: OpenAIChatMessage[] = [];

  if (context.systemPrompt) {
    messages.push({
      role: "system",
      content: context.systemPrompt,
    });
  }

  for (const message of context.messages) {
    switch (message.role) {
      case "user": {
        const content =
          typeof message.content === "string"
            ? message.content
            : message.content.map((c) => c.text).join("");
        messages.push({
          role: "user",
          content,
        });
        break;
      }
      case "assistant": {
        const text = message.content
          .filter((c): c is TextContent => c.type === "text")
          .map((c) => c.text)
          .join("");

        const toolCalls: OpenAIToolCall[] = [];
        for (const item of message.content) {
          if (item.type === "toolCall") {
            toolCalls.push({
              id: item.id,
              type: "function",
              function: {
                name: item.name,
                arguments: JSON.stringify(item.arguments),
              },
            });
          }
        }

        messages.push({
          role: "assistant",
          content: text || (toolCalls.length ? null : ""),
          tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        });
        break;
      }
      case "toolResult": {
        const content = message.content.map((c) => c.text).join("");
        messages.push({
          role: "tool",
          tool_call_id: message.toolCallId,
          content,
        });
        break;
      }
    }
  }

  return messages;
}

/**
 * TODO(step03): 把 Tool[] 翻译成 OpenAI 的 tools 参数：
 *   [{ type: "function", function: { name, description, parameters } }]
 */
export function toOpenAITools(tools: Tool[]): unknown[] {
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

/**
 * TODO(step03): OpenAI 的 finish_reason → 统一的 StopReason
 *   "stop" → "stop"，"length" → "length"，"tool_calls" → "toolUse"，其它 → "stop"
 */
export function mapStopReason(finishReason: string | null): StopReason {
  switch (finishReason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "tool_calls":
      return "toolUse";
    default:
      return "stop";
  }
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
  const content: (TextContent | ToolCall)[] = [];

  if (text) {
    content.push({ type: "text", text });
  }

  for (const tc of toolCalls) {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(tc.function.arguments);
    } catch {
      args = {};
    }
    content.push({
      type: "toolCall",
      id: tc.id,
      name: tc.function.name,
      arguments: args,
    });
  }

  return {
    role: "assistant",
    content,
    stopReason: mapStopReason(finishReason),
    model,
    timestamp: Date.now(),
  };
}
