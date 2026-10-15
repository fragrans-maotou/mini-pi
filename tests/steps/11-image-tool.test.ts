import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createImageTool } from "@mini-pi/cli";

describe("第 11 步：生图工具（mock fetch，离线）", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("保存 b64 图片并返回路径", async () => {
    process.env.IMAGE_BASE_URL = "http://fake/v1";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [{ b64_json: Buffer.from("png").toString("base64") }] })));
    vi.stubGlobal("fetch", fetchMock);
    const cwd = mkdtempSync(join(tmpdir(), "mini-pi-img-"));
    const r = await createImageTool(cwd).execute({ prompt: "a cat" }, { toolCallId: "t" });
    expect((fetchMock.mock.calls[0] as any)[0]).toBe("http://fake/v1/images/generations");
    const path = r.content.match(/(\S+\.png)/)?.[1];
    expect(path && existsSync(path.startsWith("/") ? path : join(cwd, path))).toBe(true);
  });
});
