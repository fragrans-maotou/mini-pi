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
import { toToolDefinitions, executeToolCall } from "./tools.ts";
import { AssistantMessage, ToolCall } from "@mini-pi/ai";
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
  emit: AgentEventSink = () => { },
): Promise<Message[]> {
  const newMessages: Message[] = [];
  const push = (m: Message) => { context.messages.push(m); newMessages.push(m); }
  const maxTurns = config.maxTurns ?? 20
  const tools = toToolDefinitions(config.tools)
  let turns = 0

  await emit({ type: "agent_start" });
  for (const m of prompts) {
    push(m);
  }

  outer: while (true) {
    while (true) {
      // break outer 是带标签的 break，可以从内层直接跳出两层。maxTurns 到了就是这么停的
      if (turns >= maxTurns) break outer;
      turns++;

      // 1. 调模型：跟 complete 一样消费事件
      let assistant: AssistantMessage | undefined;
      for await (const ev of config.streamFn(config.model, { ...context, tools }, { signal: config.signal })) {
        if (ev.type === "text_delta") {
          await emit({ type: "text_delta", delta: ev.delta });
        }
        if (ev.type === "done" || ev.type === "error") {
          assistant = ev.message;
        }
      }
      // 没有获取到内容就抛出异常
      if (!assistant) throw new Error("流结束了但没有 done/error")
      push(assistant);

      // 2. 出错就结束
      // 空 ①：stopReason 是 "error" 或 "aborted" 时，发 agent_end 并 return newMessages
      if (assistant.stopReason === "error" || assistant.stopReason === "aborted") {
        break outer;
      }

      // 3. 输出结束，开始工具调用
      const toolCalls = assistant.content.filter((c): c is ToolCall => c.type === "toolCall")
      // 空 ②：没有 toolCalls 就跳出内层（break）
      if (toolCalls.length === 0) break;

      // 4. 给每个 toolCall 派发 beforeToolCall + execute + afterToolCall
      for (const tc of toolCalls) {
        const result = await executeToolCall(config.tools, tc, config.signal);
        push(result);
      }
    }
    // 空 ③：外层循环。调用 config.getFollowUpMessages?.()，
    //       没拿到或者是空数组就 break；有的话逐条 push，然后继续

    const followUps = (await config.getFollowUpMessages?.()) ?? [];
    if (followUps.length === 0) break outer;
    for (const m of followUps) push(m);
  }

  await emit({ type: "agent_end", messages: context.messages });
  return newMessages;
}
