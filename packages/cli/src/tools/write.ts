// 第 8 步（TODO）：write 工具。对应 pi：packages/coding-agent/src/core/tools/write.ts
import type { AgentTool, AgentToolResult } from "@mini-pi/agent";
import path from "path";
import fs from "fs/promises";

/**
 * TODO(step08): 写文件（自动创建父目录）。安全：path 解析后必须在 cwd 里面，否则返回错误。
 * 写文件工具（自动创建父目录并覆盖写入内容）。
 * 安全关键：解析后的绝对路径必须严格限制在工作目录 cwd 内部，防止模型越权写敏感文件。
 */
export function createWriteTool(cwd: string): AgentTool<{ path: string; content: string }> {
  return {
    name: "write",
    description: "创建或覆盖一个文件",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件路径，相对于工作目录" },
        content: { type: "string", description: "完整文件内容" },
      },
      required: ["path", "content"],
    },
    async execute(args): Promise<AgentToolResult> {
      // 1. 将相对路径解析为规范的系统绝对路径（例如将 "sub/../a.txt" 拍平成 "/project/a.txt"）
      const resolved = path.resolve(cwd, args.path);

      // 2. 安全检查：确保路径不会逃逸出当前工作目录（防止通过 "../../etc/passwd" 实施目录穿越攻击）
      //    注意末尾加路径分隔符（如 "/project/"），避免 "/project-evil" 意外匹配前缀
      const rootWithSep = cwd.endsWith(path.sep) ? cwd : cwd + path.sep;
      if (resolved !== cwd && !resolved.startsWith(rootWithSep)) {
        return { content: `错误：不允许写到工作目录外 (${args.path})`, isError: true };
      }

      try {
        // 3. 递归创建上层所有不存在的父目录（如果写入 "src/components/Button.tsx"，自动创建 src 和 components）
        await fs.mkdir(path.dirname(resolved), { recursive: true });

        // 4. 覆盖写入文件内容（采用 UTF-8 编码）
        await fs.writeFile(resolved, args.content, "utf-8");

        return { content: `成功写入 ${args.path} (${args.content.length} 字符)`, isError: false };
      } catch (error) {
        // 5. 捕获系统级异常（如磁盘满、无权限等），包装成 isError: true 喂给模型，让模型知道并反思
        const message = error instanceof Error ? error.message : String(error);
        return { content: `写入失败: ${message}`, isError: true };
      }
    },
  };
}
