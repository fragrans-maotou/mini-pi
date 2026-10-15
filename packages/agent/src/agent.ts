// 第 7 步（TODO）：Agent 类 —— 把循环包起来，管理状态 + 事件订阅。
// 对应 pi：packages/agent/src/agent.ts（state、subscribe、prompt、abort、followUp）
import type { Message, Model, StreamFunction } from "@mini-pi/ai";
import type { AgentEvent, AgentLoopConfig, AgentTool } from "./types.ts";

export interface AgentOptions {
  model: Model;
  streamFn: StreamFunction;
  systemPrompt?: string;
  tools?: AgentTool<any>[];
  beforeToolCall?: AgentLoopConfig["beforeToolCall"];
  afterToolCall?: AgentLoopConfig["afterToolCall"];
}

export class Agent {
  readonly messages: Message[] = [];

  constructor(readonly options: AgentOptions) {}

  /** TODO(step07): 订阅事件，返回取消订阅的函数 */
  subscribe(listener: (event: AgentEvent) => void): () => void {
    throw new Error("TODO(step07): 实现 subscribe");
  }

  /**
   * TODO(step07): 发一条用户消息并跑完 agent 循环。
   *  - 正在运行时再调用 → 抛错（或进阶：放进 followUp 队列）
   *  - 用 AbortController 支持 abort()
   *  - 把事件分发给所有订阅者
   */
  async prompt(text: string): Promise<void> {
    throw new Error("TODO(step07): 实现 prompt");
  }

  /** TODO(step07): 进阶 —— 运行中排队一条消息，当前任务结束后自动接着处理（对应外层循环） */
  followUp(text: string): void {
    throw new Error("TODO(step07): 实现 followUp");
  }

  /** TODO(step07): 中止当前运行 */
  abort(): void {
    throw new Error("TODO(step07): 实现 abort");
  }
}
