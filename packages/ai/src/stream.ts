// 第 2 步（已实现）：流式 chat completion。
// 对应 pi：packages/ai/src/api/openai-completions.ts 的 `stream`，以及 utils/event-stream.ts
import { postJson, type OpenAIChatMessage, type OpenAIToolCall } from "./chat.ts";
import type { TextModelConfig } from "./env.ts";
import { readSSE } from "./sse.ts";

/** 流里吐出来的“小事件”。pi 里叫 AssistantMessageEvent（text_delta / toolcall_delta / done ...）。 */
export type ChatStreamEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_call_delta"; index: number; id?: string; name?: string; argumentsDelta: string }
  | { type: "done"; text: string; toolCalls: OpenAIToolCall[]; finishReason: string | null };

export async function* streamChatCompletion(
  config: TextModelConfig,
  messages: OpenAIChatMessage[],
  options: { signal?: AbortSignal; extraBody?: Record<string, unknown> } = {},
): AsyncGenerator<ChatStreamEvent> {
  const res = await postJson(
    config,
    "/chat/completions",
    { model: config.model, messages, stream: true, ...options.extraBody },
    options.signal,
  );
  if (!res.body) throw new Error("响应没有 body，接口可能不支持流式");
  yield* parseChatStream(readSSE(res.body));
}

/** 把 SSE 事件折叠成文本增量 + 工具调用增量。纯逻辑，可以离线测。 */
export async function* parseChatStream(
  events: AsyncIterable<{ data: string }>,
): AsyncGenerator<ChatStreamEvent> {
  let text = "";
  let finishReason: string | null = null;
  const toolCalls: OpenAIToolCall[] = [];
  for await (const ev of events) {
    if (ev.data === "[DONE]") break;
    let chunk: any;
    try {
      chunk = JSON.parse(ev.data);
    } catch {
      continue; // 有些服务会夹带非 JSON 行，忽略
    }
    const choice = chunk.choices?.[0];
    if (!choice) continue;
    const delta = choice.delta ?? {};
    if (typeof delta.content === "string" && delta.content) {
      text += delta.content;
      yield { type: "text_delta", delta: delta.content };
    }
    for (const tc of delta.tool_calls ?? []) {
      const i = tc.index ?? 0;
      toolCalls[i] ??= { id: "", type: "function", function: { name: "", arguments: "" } };
      if (tc.id) toolCalls[i].id = tc.id;
      if (tc.function?.name) toolCalls[i].function.name += tc.function.name;
      const argsDelta = tc.function?.arguments ?? "";
      toolCalls[i].function.arguments += argsDelta;
      yield { type: "tool_call_delta", index: i, id: tc.id, name: tc.function?.name, argumentsDelta: argsDelta };
    }
    if (choice.finish_reason) finishReason = choice.finish_reason;
  }
  yield { type: "done", text, toolCalls: toolCalls.filter(Boolean), finishReason };
}
