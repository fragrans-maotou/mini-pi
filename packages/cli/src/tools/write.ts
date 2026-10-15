// 第 8 步（TODO）：write 工具。对应 pi：packages/coding-agent/src/core/tools/write.ts
import type { AgentTool } from "@mini-pi/agent";

/** TODO(step08): 写文件（自动创建父目录）。安全：path 解析后必须在 cwd 里面，否则返回错误。 */
export function createWriteTool(cwd: string): AgentTool<{ path: string; content: string }> {
  return {
    name: "write",
    description: "创建或覆盖一个文件",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件路径，相对于工作目录" },
        content: { type: "string", description: "完整文件内容" },
      },
      required: ["path", "content"],
    },
    async execute(args) {
      throw new Error("TODO(step08): 实现 write 工具");
    },
  };
}
