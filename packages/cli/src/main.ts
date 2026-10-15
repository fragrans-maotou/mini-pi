// 最终的命令行 agent（npm run chat）。第 8 步之后就能跑起来。
// 对应 pi：packages/coding-agent/src/main.ts + core/agent-session.ts
// 这个文件是“胶水”：把 ai + agent + 工具 + 会话 组装起来。随着你完成每一步，把对应的 TODO 打开。
import { ConfigError, getTextModelConfig, stream, type Model } from "@mini-pi/ai";
import { Agent } from "@mini-pi/agent";
import { createInterface } from "node:readline/promises";
import { confirmBash, createBashTool } from "./tools/bash.ts";
import { createReadTool } from "./tools/read.ts";
import { createWriteTool } from "./tools/write.ts";

async function main() {
  const cfg = getTextModelConfig();
  const model: Model = { id: cfg.model, api: "openai-completions", baseUrl: cfg.baseUrl, apiKey: cfg.apiKey };
  const cwd = process.cwd();
  const agent = new Agent({
    model,
    streamFn: stream,
    systemPrompt: `你是一个编程助手，工作目录是 ${cwd}。需要时使用工具。`,
    tools: [createReadTool(cwd), createWriteTool(cwd), createBashTool(cwd)],
    beforeToolCall: async (call) => {
      if (call.name === "bash" && !(await confirmBash(String(call.arguments.command)))) {
        return { block: true, reason: "用户拒绝执行这条命令" };
      }
    },
  });
  agent.subscribe((e) => {
    if (e.type === "text_delta") process.stdout.write(e.delta);
    if (e.type === "tool_execution_start") console.log(`\n🔧 ${e.toolCall.name} ${JSON.stringify(e.toolCall.arguments)}`);
  });
  // TODO(step09): 用 SessionManager 把每条 message_end 存下来；支持 --resume <file>
  // TODO(step10): 每次 prompt 前检查 shouldCompact，需要就压缩
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log("mini-pi 已启动，输入 exit 退出");
  while (true) {
    const line = (await rl.question("\n> ")).trim();
    if (line === "exit") break;
    if (line) await agent.prompt(line);
  }
  rl.close();
}

main().catch((err) => {
  console.error(err instanceof ConfigError ? `⚠️  ${err.message}` : `❌ ${err.message}`);
  process.exit(1);
});
