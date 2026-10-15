// 假模型（已实现，是“测试工具”不是作业）：不联网，按剧本依次返回预先写好的回复。
// 用来离线验证第 5~7 步的 agent 循环。pi 测试里也有类似的 faux provider。
import type { AssistantMessage, AssistantMessageEvent, Context, Model, StreamFunction, TextContent, ToolCall } from "../types.ts";

export type FakeReply =
  | AssistantMessage
  | ((context: Context, callIndex: number) => AssistantMessage);

/** 方便写剧本：fakeText("你好")、fakeToolCall("read", { path: "a.txt" }) */
export function fakeText(text: string): AssistantMessage {
  return { role: "assistant", content: [{ type: "text", text }], stopReason: "stop", timestamp: Date.now() };
}

export function fakeToolCall(name: string, args: Record<string, unknown>, id = `call_${name}_${Math.random().toString(36).slice(2, 8)}`): AssistantMessage {
  return { role: "assistant", content: [{ type: "toolCall", id, name, arguments: args }], stopReason: "toolUse", timestamp: Date.now() };
}

export interface FakeModel {
  model: Model;
  streamFn: StreamFunction;
  /** 每次调用时模型看到的 context（深拷贝），方便断言 */
  calls: Context[];
}

/** 创建一个按剧本回复的假模型。剧本用完后会返回 stopReason=error 的消息。 */
export function createFakeModel(script: FakeReply[]): FakeModel {
  const calls: Context[] = [];
  const model: Model = { id: "fake-model", api: "fake", baseUrl: "fake://" };
  const streamFn: StreamFunction = async function* (_model, context): AsyncGenerator<AssistantMessageEvent> {
    const i = calls.length;
    calls.push(structuredClone(context));
    const step = script[i];
    if (!step) {
      yield { type: "error", message: { role: "assistant", content: [], stopReason: "error", errorMessage: `假模型的剧本用完了（第 ${i + 1} 次调用）`, timestamp: Date.now() } };
      return;
    }
    const message = typeof step === "function" ? step(context, i) : { ...step, timestamp: Date.now() };
    for (const block of message.content) {
      if (block.type === "text") yield { type: "text_delta", delta: (block as TextContent).text };
      else yield { type: "toolcall_delta", index: 0, delta: JSON.stringify((block as ToolCall).arguments) };
    }
    yield { type: "done", message };
  };
  return { model, streamFn, calls };
}
