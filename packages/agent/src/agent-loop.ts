// 第 6 步（TODO）：Agent 循环 —— 整个项目的心脏。
// 对应 pi：packages/agent/src/agent-loop.ts 的 runLoop（双层 while）
//
// 伪代码：
//   emit agent_start
//   while (true) {                                   // 外层：处理“追加消息”（follow-up）
//     while (还有工具调用要处理) {                      // 内层：模型 ↔ 工具 来回
//       emit turn_start
//       assistant = 调模型(context)（流式，转发 text_delta）
//       context.messages.push(assistant)
//       if (assistant.stopReason 是 error/aborted) → emit agent_end 并返回
//       toolCalls = assistant.content 里所有 toolCall
//       for 每个 toolCall: beforeToolCall（block 时生成 isError 的结果，content 写上 reason）
//                          → executeToolCall → afterToolCall（被拦截的结果也要过它）→ push 结果
//       调模型时 context.tools = toToolDefinitions(config.tools)
//       emit turn_end
//       如果没有 toolCalls → 跳出内层
//     }
//     followUps = getFollowUpMessages?.()；没有 → break；有 → push 进 context，继续
//   }
//   emit agent_end
import type { Context, Message } from "@mini-pi/ai";
import type { AgentEventSink, AgentLoopConfig } from "./types.ts";

/**
 * TODO(step06): 运行 agent 循环。
 * @param prompts   这一轮新加入的消息（通常是一条 UserMessage）
 * @param context   之前的对话（会被原地追加）
 * @param config    模型、工具、钩子
 * @param emit      事件回调（第 7 步用；第 6 步可以先只发 agent_start/agent_end）
 * @returns         这次运行新产生的所有消息（包括 prompts）
 * 别忘了 maxTurns（默认 20）防止模型无限调工具。
 */
export async function runAgentLoop(
  prompts: Message[],
  context: Context,
  config: AgentLoopConfig,
  emit: AgentEventSink = () => {},
): Promise<Message[]> {
  throw new Error("TODO(step06): 实现 runAgentLoop");
}
