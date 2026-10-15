// 第 3 步：统一消息类型。
// 这些类型已经给你写好了（照着 pi 简化的），第 3 步要做的是 convert.ts 里的“翻译”。
// 对应 pi：packages/ai/src/types.ts（TextContent / ToolCall / AssistantMessage / Context / Tool ...）
//
// 为什么要自己定义一套，而不是直接用 OpenAI 格式？
// 因为不同厂商（OpenAI / Anthropic / Google）格式都不一样。agent 层只认这一套，
// 每个 provider 负责把它翻译成自己的线上格式。这样换模型时 agent 一行都不用改。

export interface TextContent {
  type: "text";
  text: string;
}

export interface ToolCall {
  type: "toolCall";
  id: string;
  name: string;
  /** 已经 JSON.parse 好的参数 */
  arguments: Record<string, unknown>;
}

export interface UserMessage {
  role: "user";
  content: string | TextContent[];
  timestamp: number;
}

export type StopReason = "stop" | "length" | "toolUse" | "error" | "aborted";

export interface Usage {
  input: number;
  output: number;
}

export interface AssistantMessage {
  role: "assistant";
  content: (TextContent | ToolCall)[];
  stopReason: StopReason;
  usage?: Usage;
  errorMessage?: string;
  model?: string;
  timestamp: number;
}

export interface ToolResultMessage {
  role: "toolResult";
  toolCallId: string;
  toolName: string;
  content: TextContent[];
  isError: boolean;
  timestamp: number;
}

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

/** 一个最简单的 JSON Schema 类型。pi 用 TypeBox，这里先手写 JSON Schema。 */
export type JsonSchema = {
  type: "object";
  properties: Record<string, { type: string; description?: string; [k: string]: unknown }>;
  required?: string[];
};

/** 告诉模型“有哪些工具可用”。只是描述，不含执行逻辑（执行逻辑在 agent 包的 AgentTool 里）。 */
export interface Tool {
  name: string;
  description: string;
  parameters: JsonSchema;
}

/** 一次模型调用需要的全部上下文。 */
export interface Context {
  systemPrompt?: string;
  messages: Message[];
  tools?: Tool[];
}

/** 一个模型的描述：用哪种 api 协议、在哪、叫什么。 */
export interface Model {
  id: string;
  /** 协议名，例如 "openai-completions"、"fake"。registry 按它找 provider。 */
  api: string;
  baseUrl: string;
  apiKey?: string;
}

/** 流式事件（统一版）。第 4 步以后 agent 只认这个。 */
export type AssistantMessageEvent =
  | { type: "text_delta"; delta: string }
  | { type: "toolcall_delta"; index: number; delta: string }
  | { type: "done"; message: AssistantMessage }
  | { type: "error"; message: AssistantMessage };

export interface StreamOptions {
  signal?: AbortSignal;
}

/** 所有 provider 都要实现的函数签名：给 model + context，吐一串统一事件。 */
export type StreamFunction = (
  model: Model,
  context: Context,
  options?: StreamOptions,
) => AsyncIterable<AssistantMessageEvent>;
