import { describe, expect, it } from "vitest";
import { createFakeModel, fakeText, fakeToolCall } from "../src/providers/fake.ts";

describe("假模型", () => {
  it("按剧本依次回复，剧本用完返回 error", async () => {
    const fake = createFakeModel([fakeToolCall("read", { path: "a" }, "c1"), fakeText("好了")]);
    const ctx = { messages: [] };
    const types = async () => { const t = []; for await (const e of fake.streamFn(fake.model, ctx)) t.push(e.type); return t; };
    expect(await types()).toEqual(["toolcall_delta", "done"]);
    expect(await types()).toEqual(["text_delta", "done"]);
    expect(await types()).toEqual(["error"]);
    expect(fake.calls).toHaveLength(3);
  });
});
