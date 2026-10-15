// agent 层的类型（已给出）。对应 pi：packages/agent/src/types.ts
import type { AssistantMessage, Context, Message, Model, StreamFunction, Tool, ToolCall, ToolResultMessage } from "@mini-pi/ai";

/** 工具执行的结果：给模型看的文字 + 是否出错 */
export interface AgentToolResult {
  content: string;
  isError?: boolean;
}

/** 一个“能执行”的工具 = 给模型看的描述（Tool）+ 真正干活的 execute */
export interface AgentTool<TArgs = Record<string, unknown>> extends Tool {
  execute(args: TArgs, ctx: { toolCallId: string; signal?: AbortSignal }): Promise<AgentToolResult>;
}

/** 第 7 步：事件。UI、日志、会话保存都靠订阅这些事件，而不是去改循环本身。 */
export type AgentEvent =
  | { type: "agent_start" }
  | { type: "turn_start" }
  | { type: "message_start"; message: Message }
  | { type: "text_delta"; delta: string }
  | { type: "message_end"; message: Message }
  | { type: "tool_execution_start"; toolCall: ToolCall }
  | { type: "tool_execution_end"; toolCall: ToolCall; result: ToolResultMessage }
  | { type: "turn_end"; message: AssistantMessage; toolResults: ToolResultMessage[] }
  | { type: "agent_end"; messages: Message[] };

/** beforeToolCall 返回 { block: true } 就不执行这个工具（比如用户不同意跑 bash） */
export interface BeforeToolCallResult {
  block?: boolean;
  reason?: string;
}

export interface AgentLoopConfig {
  model: Model;
  streamFn: StreamFunction;
  tools: AgentTool<any>[];
  /** 防止死循环：最多调多少次模型 */
  maxTurns?: number;
  /** 第 7 步：工具执行前的钩子 */
  beforeToolCall?: (toolCall: ToolCall) => Promise<BeforeToolCallResult | void> | BeforeToolCallResult | void;
  /** 第 7 步：工具执行后的钩子，可以改写结果 */
  afterToolCall?: (toolCall: ToolCall, result: ToolResultMessage) => Promise<ToolResultMessage | void> | ToolResultMessage | void;
  /** 第 6 步进阶：内层循环结束后问一下“还有没有排队的新消息？”，有就继续（外层循环） */
  getFollowUpMessages?: () => Promise<Message[]> | Message[];
  signal?: AbortSignal;
}

export type AgentEventSink = (event: AgentEvent) => void | Promise<void>;
export type { Context };
