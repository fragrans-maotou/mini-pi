// 第 8 步（TODO）：read 工具。对应 pi：packages/coding-agent/src/core/tools/read.ts
import type { AgentTool, AgentToolResult } from "@mini-pi/agent";
import fs from "fs/promises";
import path from "path";

/** TODO(step08): 读文件。参数 { path, offset?, limit? }；输出带行号；太长要截断（比如 2000 行），并告诉模型“还有更多” */
export function createReadTool(cwd: string): AgentTool<{ path: string; offset?: number; limit?: number }> {
  return {
    name: "read",
    description: "读取一个文本文件的内容（带行号）",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件路径，相对于工作目录" },
        offset: { type: "number", description: "从第几行开始（1 开始）" },
        limit: { type: "number", description: "最多读多少行" },
      },
      required: ["path"],
    },
    async execute(args): Promise<AgentToolResult> {
      const resolved = path.resolve(cwd, args.path);
      try {
        const text = await fs.readFile(resolved, "utf-8");
        const lines = text.split("\n");
        const offset = Math.max(1, args.offset ?? 1);
        const limit = Math.max(1, args.limit ?? 2000);

        const startIndex = offset - 1;
        const slice = lines.slice(startIndex, startIndex + limit);

        const content = slice.map((line, i) => `${offset + i}|${line}`);
        const totalRead = startIndex + slice.length;

        if (totalRead < lines.length) {
          content.push(`\n... 还有 ${lines.length - totalRead} 行未显示，可使用 offset=${totalRead + 1} 继续读取 ...`);
        }

        return { content: content.join("\n"), isError: false };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: `读取失败: ${message}`, isError: true };
      }
    },
  };
}
