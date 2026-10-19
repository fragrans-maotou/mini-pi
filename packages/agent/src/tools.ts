// 第 5 步（TODO）：定义工具 + 让模型调用工具。
// 对应 pi：packages/agent/src/types.ts 的 AgentTool；参数校验见 packages/ai/src/utils/validation.ts
import type { Tool, ToolCall, ToolResultMessage } from "@mini-pi/ai";
import type { AgentTool } from "./types.ts";

/** TODO(step05): 把 AgentTool[] 变成只含描述的 Tool[]（去掉 execute），给模型看 */
export function toToolDefinitions(tools: AgentTool<any>[]): Tool[] {
  // 遍历 AgentTool 数组，获取信息
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}

/**
 * TODO(step05): 极简参数校验：检查 schema.required 里的字段都在，类型（string/number/boolean）对得上。
 * 返回错误信息字符串；没问题返回 undefined。
 * （pi 用 TypeBox + 校验器做这件事，我们手写一个够用的）
 */
export function validateArgs(tool: Tool, args: Record<string, unknown>): string | undefined {
  throw new Error("TODO(step05): 实现 validateArgs");
}

/**
 * TODO(step05): 执行一个工具调用，永远返回 ToolResultMessage，不往外抛异常：
 *  - 找不到工具 → isError: true，content 写“未知工具 xxx”
 *  - 参数校验失败 → isError: true
 *  - execute 抛异常 → isError: true，content 写错误信息
 * 为什么不抛？因为错误要“喂回给模型”，让它自己改正 —— 这是 agent 的关键思想之一。
 */
export async function executeToolCall(
  tools: AgentTool<any>[],
  toolCall: ToolCall,
  signal?: AbortSignal,
): Promise<ToolResultMessage> {
  throw new Error("TODO(step05): 实现 executeToolCall");
}
