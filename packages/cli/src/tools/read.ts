// 第 8 步（TODO）：read 工具。对应 pi：packages/coding-agent/src/core/tools/read.ts
import type { AgentTool } from "@mini-pi/agent";

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
    async execute(args) {
      throw new Error("TODO(step08): 实现 read 工具");
    },
  };
}
