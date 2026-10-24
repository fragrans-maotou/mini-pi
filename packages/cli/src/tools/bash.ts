import type { AgentTool, AgentToolResult } from "@mini-pi/agent";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";

const MAX_OUTPUT_LENGTH = 50000;

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
    async execute(args, ctx): Promise<AgentToolResult> {
      return new Promise<AgentToolResult>((resolve) => {
        const timeoutSeconds = args.timeout ?? 30;
        let output = "";
        let killedByTimeout = false;
        let killedBySignal = false;

        const child = spawn("bash", ["-lc", args.command], {
          cwd,
          env: process.env,
        });

        child.stdout?.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });
        child.stderr?.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });

        const timer = setTimeout(() => {
          killedByTimeout = true;
          child.kill("SIGTERM");
        }, timeoutSeconds * 1000);

        const onAbort = () => {
          killedBySignal = true;
          child.kill("SIGTERM");
        };
        ctx?.signal?.addEventListener("abort", onAbort, { once: true });

        child.on("error", (err) => {
          clearTimeout(timer);
          ctx?.signal?.removeEventListener("abort", onAbort);
          resolve({
            content: `进程启动失败: ${err.message}`,
            isError: true,
          });
        });

        child.on("close", (code, signal) => {
          clearTimeout(timer);
          ctx?.signal?.removeEventListener("abort", onAbort);

          let finalOutput = output;
          if (finalOutput.length > MAX_OUTPUT_LENGTH) {
            finalOutput =
              `... [输出过长，已截断前 ${finalOutput.length - MAX_OUTPUT_LENGTH} 字符] ...\n` +
              finalOutput.slice(-MAX_OUTPUT_LENGTH);
          }

          if (killedByTimeout) {
            return resolve({
              content: `${finalOutput}\n(执行超时: 超过 ${timeoutSeconds} 秒)`,
              isError: true,
            });
          }

          if (killedBySignal) {
            return resolve({
              content: `${finalOutput}\n(任务已被取消)`,
              isError: true,
            });
          }

          if (code !== 0) {
            const exitInfo = code !== null ? `(退出码: ${code})` : `(被信号终止: ${signal})`;
            return resolve({
              content: finalOutput.trim() ? `${finalOutput.trim()}\n${exitInfo}` : exitInfo,
              isError: true,
            });
          }

          resolve({
            content: finalOutput.trim() || "(命令已执行，无输出)",
            isError: false,
          });
        });
      });
    },
  };
}

/** TODO(step08): 在终端问用户 “要执行 xxx 吗？[y/N]”，返回是否同意。用 node:readline/promises。 */
export async function confirmBash(command: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`要执行 "${command}" 吗？[y/N] `);
    return answer.trim().toLowerCase() === "y";
  } finally {
    rl.close();
  }
}
