// 最终的命令行 agent（npm run chat）。第 8 步之后就能跑起来。
// 对应 pi：packages/coding-agent/src/main.ts + core/agent-session.ts
// 这个文件是“胶水”：把 ai + agent + 工具 + 会话 组装起来。随着你完成每一步，把对应的 TODO 打开。
import { ConfigError, getTextModelConfig, stream, type Model } from "@mini-pi/ai";
import { Agent } from "@mini-pi/agent";
import { createInterface } from "node:readline/promises";
import { confirmBash, createBashTool } from "./tools/bash.ts";
import { createReadTool } from "./tools/read.ts";
import { createWriteTool } from "./tools/write.ts";
import { SessionManager } from "./session.ts";
import { shouldCompact, findCutPoint, summarize } from "./compaction.ts";

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
  // TODO(step09): 用 SessionManager 把每条 message_end 存下来；支持 --resume <file>
  // 1. 会话初始化（支持 --resume <file> 恢复历史对话）
  const resumeIdx = process.argv.indexOf("--resume");
  const resumeFile = resumeIdx !== -1 ? process.argv[resumeIdx + 1] : undefined;
  const session = resumeFile
    ? SessionManager.open(resumeFile)
    : SessionManager.create(cwd);

  if (resumeFile) {
    for (const msg of session.buildMessages()) {
      agent.messages.push(msg);
    }
    console.log(`已恢复历史会话，加载了 ${agent.messages.length} 条消息`);
  }
  console.log(`会话文件: ${session.file}`);

  agent.subscribe((e) => {
    if (e.type === "text_delta") process.stdout.write(e.delta);
    if (e.type === "tool_execution_start") console.log(`\n🔧 ${e.toolCall.name} ${JSON.stringify(e.toolCall.arguments)}`);
    if (e.type === "message_end") session.appendMessage(e.message);
  });

  // 上下文窗口限制大小（可根据模型调整，例如 128000）
  const contextWindow = 128000;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log("mini-pi 已启动，输入 exit 退出");

  while (true) {
    const line = (await rl.question("\n> ")).trim();
    if (line === "exit") break;
    if (!line) continue;

    // TODO(step10): 每次 prompt 前检查 shouldCompact，需要就自动压缩
    if (shouldCompact(agent.messages, contextWindow)) {
      console.log("\n⚡ 上下文过长，正在提炼历史摘要...");
      const cut = findCutPoint(agent.messages, 4000);
      if (cut > 0) {
        const toSummarize = agent.messages.slice(0, cut);
        const firstKeptMsg = agent.messages[cut];

        // 1. 调用模型压缩生成中文摘要
        const summary = await summarize(toSummarize, model, stream);

        // 2. 在 session entries 中找到保留区首条消息对应的 entry.id
        const entries = session.getEntries();
        const keptEntry = entries.find(
          (e) => e.type === "message" && e.message === firstKeptMsg,
        );
        const firstKeptEntryId = keptEntry ? keptEntry.id : entries[entries.length - 1].id;

        // 3. 追加写入 compaction 记录
        session.appendCompaction(summary, firstKeptEntryId);

        // 4. 重建 agent.messages 内存状态
        agent.messages.length = 0;
        for (const msg of session.buildMessages()) {
          agent.messages.push(msg);
        }
        console.log(`✓ 压缩完成，当前上下文重置为 ${agent.messages.length} 条消息`);
      }
    }

    await agent.prompt(line);
  }
  rl.close();
}

main().catch((err) => {
  console.error(err instanceof ConfigError ? `⚠️  ${err.message}` : `❌ ${err.message}`);
  process.exit(1);
});
