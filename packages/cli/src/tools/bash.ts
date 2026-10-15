// 第 8 步（TODO）：bash 工具。对应 pi：packages/coding-agent/src/core/tools/bash.ts + core/bash-executor.ts
import type { AgentTool } from "@mini-pi/agent";

/**
 * TODO(step08): 执行 shell 命令（child_process.spawn("bash", ["-lc", command], { cwd })）。
 *  - 合并 stdout/stderr，超长截断（保留尾部更有用，想想为什么）
 *  - 支持 timeout（秒）和 signal 中止
 *  - 退出码非 0 → isError: true，并把退出码写进 content
 * 注意：执行前的“确认提示”不写在这里，而是用第 7 步的 beforeToolCall 钩子做（见 main.ts）。
 */
export function createBashTool(cwd: string): AgentTool<{ command: string; timeout?: number }> {
  return {
    name: "bash",
    description: "在工作目录里执行一条 bash 命令，返回输出",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "要执行的命令" },
        timeout: { type: "number", description: "超时秒数，默认 30" },
      },
      required: ["command"],
    },
    async execute(args, ctx) {
      throw new Error("TODO(step08): 实现 bash 工具");
    },
  };
}

/** TODO(step08): 在终端问用户 “要执行 xxx 吗？[y/N]”，返回是否同意。用 node:readline/promises。 */
export async function confirmBash(command: string): Promise<boolean> {
  throw new Error("TODO(step08): 实现 confirmBash");
}
