import { describe, expect, it } from "vitest";
import { createFakeModel, fakeText, fakeToolCall, type Context } from "@mini-pi/ai";
import { runAgentLoop, type AgentTool } from "@mini-pi/agent";

const echo: AgentTool<{ text: string }> = {
  name: "echo", description: "回声",
  parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
  async execute({ text }) { return { content: `echo:${text}` }; },
};
const user = (content: string) => ({ role: "user" as const, content, timestamp: 0 });

describe("第 6 步：Agent 循环（假模型，离线）", () => {
  it("模型调工具 → 结果喂回去 → 模型给出最终回答", async () => {
    const fake = createFakeModel([fakeToolCall("echo", { text: "喵" }, "c1"), fakeText("完成")]);
    const context: Context = { messages: [] };
    const out = await runAgentLoop([user("hi")], context, { model: fake.model, streamFn: fake.streamFn, tools: [echo] });
    expect(out.map((m) => m.role)).toEqual(["user", "assistant", "toolResult", "assistant"]);
    expect(fake.calls).toHaveLength(2);
    // 第二次调模型时，它必须能看到工具结果
    expect(fake.calls[1].messages.at(-1)).toMatchObject({ role: "toolResult", toolCallId: "c1", content: [{ text: "echo:喵" }] });
    expect(fake.calls[1].tools?.[0].name).toBe("echo");
    expect(context.messages).toHaveLength(4);
  });

  it("maxTurns 防止死循环", async () => {
    const fake = createFakeModel(Array.from({ length: 50 }, () => fakeToolCall("echo", { text: "x" })));
    await runAgentLoop([user("hi")], { messages: [] }, { model: fake.model, streamFn: fake.streamFn, tools: [echo], maxTurns: 3 });
    expect(fake.calls).toHaveLength(3);
  });

  it("模型出错时优雅结束", async () => {
    const fake = createFakeModel([]); // 剧本为空 → error
    const out = await runAgentLoop([user("hi")], { messages: [] }, { model: fake.model, streamFn: fake.streamFn, tools: [] });
    expect(out.at(-1)).toMatchObject({ role: "assistant", stopReason: "error" });
  });

  it("外层循环：follow-up 消息", async () => {
    const fake = createFakeModel([fakeText("一"), fakeText("二")]);
    const queue = [user("再来一个")];
    const out = await runAgentLoop([user("hi")], { messages: [] }, {
      model: fake.model, streamFn: fake.streamFn, tools: [], getFollowUpMessages: () => queue.splice(0),
    });
    expect(out.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant"]);
  });
});
