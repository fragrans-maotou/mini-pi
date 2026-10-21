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

function errorResult(toolCall: ToolCall, text: string): ToolResultMessage {
  return {
    role: "toolResult",
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    content: [{ type: "text", text }],
    isError: true,
    timestamp: Date.now(),
  };
}

/**
 * TODO(step05): 极简参数校验：检查 schema.required 里的字段都在，类型（string/number/boolean）对得上。
 * 返回错误信息字符串；没问题返回 undefined。
 * （pi 用 TypeBox + 校验器做这件事，我们手写一个够用的）
 */
export function validateArgs(tool: Tool, args: Record<string, unknown>): string | undefined {
  const properties = tool.parameters?.properties ?? {};
  const required = tool.parameters?.required ?? [];

  // 1. 检查必填参数是否存在
  for (const key of required) {
    if (!(key in args) || args[key] === undefined) {
      return `请求缺少必填参数: ${key}`;
    }
  }

  // 2. 检查传入参数的类型（只校验 string / number / boolean，跳过 integer、array、object 等）
  const CHECKED_TYPES = new Set(["string", "number", "boolean"]);

  for (const [key, val] of Object.entries(args)) {
    if (val === undefined) continue;
    const prop = properties[key];
    if (!prop) continue;

    if (CHECKED_TYPES.has(prop.type)) {
      if (typeof val !== prop.type) {
        return `参数 ${key} 类型不匹配，期望 ${prop.type}，实际 ${typeof val}`;
      }
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
  if (!tool) {
    return errorResult(toolCall, `未知工具: ${toolCall.name}`);
  }

  const errorMessage = validateArgs(tool, toolCall.arguments);
  if (errorMessage) {
    return errorResult(toolCall, errorMessage);
  }

  try {
    const result = await tool.execute(toolCall.arguments, { toolCallId: toolCall.id, signal });
    return {
      role: "toolResult",
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      content: [{ type: "text", text: result.content || "" }],
      isError: result.isError ?? false,
      timestamp: Date.now(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(toolCall, message);
  }
}
