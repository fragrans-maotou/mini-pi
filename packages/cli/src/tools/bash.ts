// 第 8 步（TODO）：bash 工具。对应 pi：packages/coding-agent/src/core/tools/bash.ts + core/bash-executor.ts
import type { AgentTool, AgentToolResult } from "@mini-pi/agent";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";

// 最大返回字符数：限制为 5 万字符，防止如 "cat bigfile" 这类命令输出爆炸耗尽模型上下文
const MAX_OUTPUT_LENGTH = 50000;

/**
 * TODO(step08): 执行 shell 命令（child_process.spawn("bash", ["-lc", command], { cwd })）。
 * bash 命令执行工具。
 * 核心机制：
 *  1. 派生登录式 bash shell 子进程，继承父进程环境变量；
 *  2. 流式合并标准输出（stdout）和错误输出（stderr）；
 *  3. 超时强杀（防止死循环脚本）与取消信号监听（用户在 UI 点击 Stop 时杀死子进程）；
 *  4. 截断保护：当输出超长时，截掉头部、保留末尾（因为编译报错、异常堆栈通常在最底部）；
 *  5. 退出码识别：退出码非 0 标记 isError: true，促使模型纠错。
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

        // 1. 派生系统子进程：
        //    - "bash": 指定 shell 解释器
        //    - "-l": login shell，会加载 ~/.bash_profile、~/.zshrc 等配置文件，确保能找到 PATH 里的 node、git、npm 等工具
        //    - "-c": 将后面的字符串直接作为完整命令执行
        //    - cwd: 限制子进程在当前工程工作目录启动
        //    - env: 继承当前 Node 进程的环境变量
        const child = spawn("bash", ["-lc", args.command], {
          cwd,
          env: process.env,
        });

        // 2. 收集标准输出（stdout）与标准错误（stderr），统一合并到 output
        //    （很多工具如 git、curl 会把进度或非致命信息输出到 stderr，合并起来模型才能看到完整全貌）
        child.stdout?.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });
        child.stderr?.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });

        // 3. 超时定时器：防止死循环（如 `while true`）永久挂起
        const timer = setTimeout(() => {
          killedByTimeout = true;
          child.kill("SIGTERM"); // 优雅杀死子进程
        }, timeoutSeconds * 1000);

        // 4. 用户主动取消（总控红线）：
        //    如果用户在前端点击了 "Stop" 按钮，ctx.signal 会触发 abort 事件，立刻杀掉正在跑的子进程
        const onAbort = () => {
          killedBySignal = true;
          child.kill("SIGTERM");
        };
        ctx?.signal?.addEventListener("abort", onAbort, { once: true });

        // 5. 进程启动失败异常（例如系统找不到 bash 解释器）
        child.on("error", (err) => {
          clearTimeout(timer);
          ctx?.signal?.removeEventListener("abort", onAbort);
          resolve({
            content: `进程启动失败: ${err.message}`,
            isError: true,
          });
        });

        // 6. 子进程关闭，汇总最终结果
        child.on("close", (code, signal) => {
          // 清理定时器和事件监听器，防止内存泄漏
          clearTimeout(timer);
          ctx?.signal?.removeEventListener("abort", onAbort);

          // 7. 超长截断处理：保留尾部
          //    思考：为什么截掉前面、保留末尾？
          //    因为大型编译或测试输出时，真正的 SyntaxError、TS 报错或测试失败原因都在最末尾几十行！
          let finalOutput = output;
          if (finalOutput.length > MAX_OUTPUT_LENGTH) {
            finalOutput =
              `... [输出过长，已截断前 ${finalOutput.length - MAX_OUTPUT_LENGTH} 字符] ...\n` +
              finalOutput.slice(-MAX_OUTPUT_LENGTH);
          }

          // 超时退出判断
          if (killedByTimeout) {
            return resolve({
              content: `${finalOutput}\n(执行超时: 超过 ${timeoutSeconds} 秒)`,
              isError: true,
            });
          }

          // 用户取消判断
          if (killedBySignal) {
            return resolve({
              content: `${finalOutput}\n(任务已被取消)`,
              isError: true,
            });
          }

          // 退出码判断：非 0 说明命令执行有误（如语法错、文件不存在、编译失败等）
          if (code !== 0) {
            const exitInfo = code !== null ? `(退出码: ${code})` : `(被信号终止: ${signal})`;
            return resolve({
              content: finalOutput.trim() ? `${finalOutput.trim()}\n${exitInfo}` : exitInfo,
              isError: true,
            });
          }

          // 正常成功完成
          resolve({
            content: finalOutput.trim() || "(命令已执行，无输出)",
            isError: false,
          });
        });
      });
    },
  };
}

/**
 * TODO(step08): 在终端问用户 “要执行 xxx 吗？[y/N]”，返回是否同意。用 node:readline/promises。
 * 终端交互确认函数：
 * 用于第 7 步的 beforeToolCall 钩子。执行危险的 bash 命令前，先暂停向终端人类询问授权。
 */
export async function confirmBash(command: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`要执行 "${command}" 吗？[y/N] `);
    return answer.trim().toLowerCase() === "y";
  } finally {
    rl.close();
  }
}
