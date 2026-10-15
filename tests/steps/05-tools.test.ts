import { describe, expect, it } from "vitest";
import { executeToolCall, toToolDefinitions, validateArgs, type AgentTool } from "@mini-pi/agent";

const add: AgentTool<{ a: number; b: number }> = {
  name: "add",
  description: "加法",
  parameters: { type: "object", properties: { a: { type: "number" }, b: { type: "number" } }, required: ["a", "b"] },
  async execute({ a, b }) { return { content: String(a + b) }; },
};
const boom: AgentTool = { name: "boom", description: "", parameters: { type: "object", properties: {} }, async execute() { throw new Error("炸了"); } };

describe("第 5 步：工具", () => {
  it("toToolDefinitions 去掉 execute", () => {
    expect(toToolDefinitions([add])[0]).not.toHaveProperty("execute");
  });
  it("validateArgs", () => {
    expect(validateArgs(add, { a: 1, b: 2 })).toBeUndefined();
    expect(validateArgs(add, { a: 1 })).toBeTypeOf("string");
    expect(validateArgs(add, { a: 1, b: "2" })).toBeTypeOf("string");
  });
  it("executeToolCall 从不抛异常", async () => {
    const ok = await executeToolCall([add, boom], { type: "toolCall", id: "1", name: "add", arguments: { a: 1, b: 2 } });
    expect(ok).toMatchObject({ role: "toolResult", toolCallId: "1", isError: false, content: [{ type: "text", text: "3" }] });
    expect((await executeToolCall([add], { type: "toolCall", id: "2", name: "nope", arguments: {} })).isError).toBe(true);
    const err = await executeToolCall([boom], { type: "toolCall", id: "3", name: "boom", arguments: {} });
    expect(err.isError).toBe(true);
    expect(err.content[0].text).toContain("炸了");
  });
});
