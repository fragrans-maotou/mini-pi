// npm run verify -- 03
import { describe, expect, it } from "vitest";
import { mapStopReason, toAssistantMessage, toOpenAIMessages } from "@mini-pi/ai";

describe("第 3 步：统一消息类型", () => {
  it("Context → OpenAI messages", () => {
    const out = toOpenAIMessages({
      systemPrompt: "sys",
      messages: [
        { role: "user", content: "hi", timestamp: 0 },
        { role: "assistant", content: [{ type: "toolCall", id: "c1", name: "read", arguments: { path: "a" } }], stopReason: "toolUse", timestamp: 0 },
        { role: "toolResult", toolCallId: "c1", toolName: "read", content: [{ type: "text", text: "内容" }], isError: false, timestamp: 0 },
      ],
    });
    expect(out[0]).toEqual({ role: "system", content: "sys" });
    expect(out[1]).toMatchObject({ role: "user", content: "hi" });
    expect(out[2].tool_calls?.[0]).toEqual({ id: "c1", type: "function", function: { name: "read", arguments: '{"path":"a"}' } });
    expect(out[3]).toMatchObject({ role: "tool", tool_call_id: "c1", content: "内容" });
  });

  it("finish_reason 映射 + 组装 AssistantMessage", () => {
    expect(mapStopReason("tool_calls")).toBe("toolUse");
    expect(mapStopReason("length")).toBe("length");
    const m = toAssistantMessage("好", [{ id: "c", type: "function", function: { name: "x", arguments: "{坏json" } }], "tool_calls");
    expect(m.stopReason).toBe("toolUse");
    expect(m.content).toEqual([{ type: "text", text: "好" }, { type: "toolCall", id: "c", name: "x", arguments: {} }]);
  });
});
