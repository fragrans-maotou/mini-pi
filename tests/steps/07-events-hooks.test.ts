import { describe, expect, it } from "vitest";
import { createFakeModel, fakeText, fakeToolCall } from "@mini-pi/ai";
import { Agent, runAgentLoop, type AgentEvent, type AgentTool } from "@mini-pi/agent";

let ran = 0;
const danger: AgentTool = { name: "danger", description: "", parameters: { type: "object", properties: {} }, async execute() { ran++; return { content: "ran" }; } };
const user = (content: string) => ({ role: "user" as const, content, timestamp: 0 });

describe("第 7 步：事件与钩子", () => {
  it("事件顺序", async () => {
    const fake = createFakeModel([fakeToolCall("danger", {}, "c1"), fakeText("ok")]);
    const events: AgentEvent["type"][] = [];
    await runAgentLoop([user("hi")], { messages: [] }, { model: fake.model, streamFn: fake.streamFn, tools: [danger] }, (e) => { events.push(e.type); });
    expect(events[0]).toBe("agent_start");
    expect(events.at(-1)).toBe("agent_end");
    expect(events).toContain("tool_execution_start");
    expect(events.indexOf("tool_execution_start")).toBeLessThan(events.indexOf("tool_execution_end"));
    expect(events.filter((t) => t === "turn_end")).toHaveLength(2);
  });

  it("beforeToolCall 可以拦截，afterToolCall 可以改写", async () => {
    ran = 0;
    const fake = createFakeModel([fakeToolCall("danger", {}, "c1"), fakeText("ok")]);
    await runAgentLoop([user("hi")], { messages: [] }, {
      model: fake.model, streamFn: fake.streamFn, tools: [danger],
      beforeToolCall: () => ({ block: true, reason: "用户拒绝" }),
      afterToolCall: (_c, r) => ({ ...r, content: [{ type: "text", text: r.content[0].text + "（已审计）" }] }),
    });
    expect(ran).toBe(0);
    const result = fake.calls[1].messages.at(-1) as any;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("用户拒绝");
    expect(result.content[0].text).toContain("（已审计）");
  });

  it("Agent 类：subscribe + prompt + 保存消息", async () => {
    const fake = createFakeModel([fakeText("你好呀")]);
    const agent = new Agent({ model: fake.model, streamFn: fake.streamFn, systemPrompt: "sys" });
    let text = "";
    const off = agent.subscribe((e) => { if (e.type === "text_delta") text += e.delta; });
    await agent.prompt("hi");
    off();
    expect(text).toBe("你好呀");
    expect(agent.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(fake.calls[0].systemPrompt).toBe("sys");
  });
});
