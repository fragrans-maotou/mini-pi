import { describe, expect, it } from "vitest";
import { createFakeModel, fakeText, type Message } from "@mini-pi/ai";
import { estimateTokens, findCutPoint, shouldCompact, summarize } from "@mini-pi/cli";

const big = "x".repeat(4000);
const msgs: Message[] = [
  { role: "user", content: big, timestamp: 0 },
  { role: "assistant", content: [{ type: "toolCall", id: "c", name: "read", arguments: {} }], stopReason: "toolUse", timestamp: 0 },
  { role: "toolResult", toolCallId: "c", toolName: "read", content: [{ type: "text", text: big }], isError: false, timestamp: 0 },
  { role: "assistant", content: [{ type: "text", text: big }], stopReason: "stop", timestamp: 0 },
  { role: "user", content: big, timestamp: 0 },
  { role: "assistant", content: [{ type: "text", text: "ok" }], stopReason: "stop", timestamp: 0 },
];

describe("第 10 步：压缩", () => {
  it("估算 token", () => {
    expect(estimateTokens(msgs)).toBeGreaterThan(3000);
    expect(shouldCompact(msgs, 100000)).toBe(false);
    expect(shouldCompact(msgs, 5000, 1000)).toBe(true);
  });
  it("切分点落在 user 消息上", () => {
    const i = findCutPoint(msgs, 1500);
    expect(msgs[i].role).toBe("user");
    expect(i).toBe(4);
  });
  it("summarize 调模型", async () => {
    const fake = createFakeModel([fakeText("摘要：用户在读文件")]);
    expect(await summarize(msgs.slice(0, 4), fake.model, fake.streamFn)).toContain("摘要");
  });
});
