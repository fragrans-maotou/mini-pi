import { describe, expect, it } from "vitest";
import { complete, createFakeModel, fakeText, getProvider, registerProvider } from "@mini-pi/ai";

describe("第 4 步：provider 注册表", () => {
  it("按 model.api 分发", async () => {
    const fake = createFakeModel([fakeText("来自假模型")]);
    registerProvider("fake", fake.streamFn);
    expect(getProvider("fake")).toBe(fake.streamFn);
    const msg = await complete(fake.model, { messages: [{ role: "user", content: "hi", timestamp: 0 }] });
    expect(msg.content[0]).toMatchObject({ text: "来自假模型" });
  });
  it("openai-completions 已注册", async () => {
    await import("@mini-pi/ai");
    expect(getProvider("openai-completions")).toBeTypeOf("function");
  });
  it("未知 api 报错", async () => {
    await expect(complete({ id: "x", api: "nope", baseUrl: "" }, { messages: [] })).rejects.toThrow();
  });
});
