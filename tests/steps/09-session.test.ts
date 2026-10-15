import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SessionManager } from "@mini-pi/cli";

describe("第 9 步：JSONL 会话", () => {
  it("写入、重新打开、还原消息", () => {
    const dir = mkdtempSync(join(tmpdir(), "mini-pi-sess-"));
    const s = SessionManager.create("/proj", dir);
    const id1 = s.appendMessage({ role: "user", content: "hi", timestamp: 1 });
    s.appendMessage({ role: "assistant", content: [{ type: "text", text: "yo" }], stopReason: "stop", timestamp: 2 });
    const lines = readFileSync(s.file, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    expect(lines[0].type).toBe("session");
    expect(lines[2].parentId).toBe(id1);
    const reopened = SessionManager.open(s.file);
    expect(reopened.buildMessages().map((m) => m.role)).toEqual(["user", "assistant"]);
  });
});
