// 第 1 步（已实现）：调一次模型 —— 最朴素的非流式 chat completion。
// 对应 pi：packages/ai/src/api/openai-completions.ts（pi 只用流式，这里先从最简单的开始）
import type { TextModelConfig } from "./env.ts";

/** OpenAI Chat Completions 的“线上格式”（wire format）消息。第 3 步会定义我们自己的统一格式。 */
export interface OpenAIChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

export interface OpenAIToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ChatCompletionResult {
  text: string;
  finishReason: string | null;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  raw: unknown;
}

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

/** 发一个 HTTP 请求，拿回完整回复。整个“调模型”本质上就是这一个 fetch。 */
export async function chatCompletion(
  config: TextModelConfig,
  messages: OpenAIChatMessage[],
  options: { signal?: AbortSignal; extraBody?: Record<string, unknown> } = {},
): Promise<ChatCompletionResult> {
  const res = await postJson(config, "/chat/completions", {
    model: config.model,
    messages,
    ...options.extraBody,
  }, options.signal);
  const data = (await res.json()) as any;
  const choice = data.choices?.[0];
  return {
    text: choice?.message?.content ?? "",
    finishReason: choice?.finish_reason ?? null,
    usage: data.usage,
    raw: data,
  };
}

/** 共用的 POST：统一处理 header 和错误信息。第 2 步的流式也用它。 */
export async function postJson(
  config: TextModelConfig,
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(config.baseUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    throw new ApiError(`连不上 ${config.baseUrl}：${(err as Error).message}。检查一下 OPENAI_BASE_URL 和网络。`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(`接口返回 HTTP ${res.status}：${text.slice(0, 500)}`, res.status);
  }
  return res;
}
