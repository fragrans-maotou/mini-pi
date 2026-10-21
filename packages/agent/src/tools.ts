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
  const { required, properties } = tool.parameters;
  if (!required) return undefined;
  for (const key of required) {
    if (!(key in args)) {
      return `请求缺少必填参数: ${key}`;
    }
    const prop = properties[key];
    if (!prop) {
      return `tool.parameters.properties中缺少必填参数: ${key}`;
    }
    const arg = args[key];
    if (typeof arg !== prop.type) {
      return `参数 ${key} 类型不匹配，期望 ${prop.type}，实际 ${typeof arg}`;
    }
  }
  return undefined;
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
  const tool = tools.find((t) => t.name === toolCall.name);
  // 找不到工具
  if (!tool) {
    return {
      role: "toolResult",
      timestamp: Date.now(),
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      isError: true,
      content: [{ type: "text", text: `未知工具: ${toolCall.name}` }],
    };
  }

  // 校验工具参数
  const errorMessage = validateArgs(tool, toolCall.arguments);
  if (errorMessage) {
    return {
      role: "toolResult",
      timestamp: Date.now(),
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      isError: true,
      content: [{ type: "text", text: errorMessage }],
    };
  }

  try {
    const result = await tool.execute(toolCall.arguments, { toolCallId: toolCall.id, signal });
    return {
      role: "toolResult",
      timestamp: Date.now(),
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      isError: result.isError ?? false,
      content: [{ type: "text", text: result.content || "" }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      role: "toolResult",
      timestamp: Date.now(),
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      isError: true,
      content: [{ type: "text", text: errorMessage }],
    };
  }

}
