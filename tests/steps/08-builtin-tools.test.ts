import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createBashTool, createReadTool, createWriteTool } from "@mini-pi/cli";

const cwd = mkdtempSync(join(tmpdir(), "mini-pi-"));
const ctx = { toolCallId: "t" };

describe("第 8 步：内置工具", () => {
  it("write + read", async () => {
    await createWriteTool(cwd).execute({ path: "sub/a.txt", content: "一\n二\n三" }, ctx);
    expect(readFileSync(join(cwd, "sub/a.txt"), "utf8")).toBe("一\n二\n三");
    const r = await createReadTool(cwd).execute({ path: "sub/a.txt", offset: 2, limit: 1 }, ctx);
    expect(r.content).toContain("二");
    expect(r.content).not.toContain("三");
  });
  it("write 不允许写到工作目录外", async () => {
    const r = await createWriteTool(cwd).execute({ path: "../evil.txt", content: "x" }, ctx);
    expect(r.isError).toBe(true);
  });
  it("bash 输出和退出码", async () => {
    const ok = await createBashTool(cwd).execute({ command: "echo hello" }, ctx);
    expect(ok.content).toContain("hello");
    const bad = await createBashTool(cwd).execute({ command: "exit 3" }, ctx);
    expect(bad.isError).toBe(true);
    expect(bad.content).toContain("3");
  });
});
