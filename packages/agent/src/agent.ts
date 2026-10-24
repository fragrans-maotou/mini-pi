// 第 7 步（TODO）：Agent 类 —— 把循环包起来，管理状态 + 事件订阅。
// 对应 pi：packages/agent/src/agent.ts（state、subscribe、prompt、abort、followUp）
import type { Context, Message, Model, StreamFunction, UserMessage } from "@mini-pi/ai";
import { runAgentLoop } from "./agent-loop.ts";
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
  private listeners = new Set<(event: AgentEvent) => void>();
  private followUpQueue: Message[] = [];
  private abortController: AbortController | null = null;

  constructor(readonly options: AgentOptions) {}

  /** TODO(step07): 订阅事件，返回取消订阅的函数 */
  subscribe(listener: (event: AgentEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * TODO(step07): 发一条用户消息并跑完 agent 循环。
   *  - 正在运行时再调用 → 抛错（或进阶：放进 followUp 队列）
   *  - 用 AbortController 支持 abort()
   *  - 把事件分发给所有订阅者
   */
  async prompt(text: string): Promise<void> {
    if (this.abortController) {
      throw new Error("Agent 正在运行中，不能重复调用 prompt");
    }

    this.abortController = new AbortController();

    const userMessage: UserMessage = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const context: Context = {
      systemPrompt: this.options.systemPrompt,
      messages: this.messages,
    };

    const config: AgentLoopConfig = {
      model: this.options.model,
      streamFn: this.options.streamFn,
      tools: this.options.tools ?? [],
      beforeToolCall: this.options.beforeToolCall,
      afterToolCall: this.options.afterToolCall,
      signal: this.abortController.signal,
      getFollowUpMessages: () => this.followUpQueue.splice(0),
    };

    const emit = (event: AgentEvent) => {
      for (const listener of this.listeners) {
        listener(event);
      }
    };

    try {
      await runAgentLoop([userMessage], context, config, emit);
    } finally {
      this.abortController = null;
    }
  }

  /** TODO(step07): 进阶 —— 运行中排队一条消息，当前任务结束后自动接着处理（对应外层循环） */
  followUp(text: string): void {
    const msg: UserMessage = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    this.followUpQueue.push(msg);
  }

  /** TODO(step07): 中止当前运行 */
  abort(): void {
    this.abortController?.abort();
  }
}
