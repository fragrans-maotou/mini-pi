// 第 8 步（TODO）：read 工具。对应 pi：packages/coding-agent/src/core/tools/read.ts
import type { AgentTool, AgentToolResult } from "@mini-pi/agent";
import fs from "fs/promises";
import path from "path";

/**
  * TODO(step08): 读文件。参数 { path, offset?, limit? }；输出带行号；太长要截断（比如 2000 行），并告诉模型“还有更多”
  * 读文件工具。
  * 特性：
  *  1. 支持 offset/limit 分页截取，防止超大文件（几万行）一次性打爆模型的 Context 窗口；
  *  2. 输出格式带行号（如 "12|const x = 1;"），让模型在后续编辑或报错时能精准定位代码行；
  *  3. 末尾智能追加“还有更多行”提示，告诉模型如何翻页继续阅读。
  */
export function createReadTool(cwd: string): AgentTool<{ path: string; offset?: number; limit?: number }> {
  return {
    name: "read",
    description: "读取一个文本文件的内容（带行号）",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件路径，相对于工作目录" },
        offset: { type: "number", description: "从第几行开始读取（从 1 开始计数，默认 1）" },
        limit: { type: "number", description: "最多读取多少行（默认 2000 行）" },
      },
      required: ["path"],
    },
    async execute(args): Promise<AgentToolResult> {
      // 1. 将文件相对路径解析成绝对路径
      const resolved = path.resolve(cwd, args.path);
      try {
        // 2. 读取文件全文并按换行符切分成行数组
        const text = await fs.readFile(resolved, "utf-8");
        const lines = text.split("\n");

        // 3. 规范化分页参数：
        //    - offset 默认从第 1 行开始（防止传入 0 或负数导致越界，用 Math.max 兜底）
        //    - limit 默认单次最多读 2000 行
        const offset = Math.max(1, args.offset ?? 1);
        const limit = Math.max(1, args.limit ?? 2000);

        // 4. 计算数组切片范围：
        //    人类习惯行号从 1 开始，JS 数组下标从 0 开始，所以 startIndex = offset - 1
        const startIndex = offset - 1;
        const slice = lines.slice(startIndex, startIndex + limit);

        // 5. 格式化输出：为每行打上真实行号（如 "1|hello"、"2|world"）
        const content = slice.map((line, i) => `${offset + i}|${line}`);
        const totalRead = startIndex + slice.length;

        // 6. 如果文件没有读完，追加友好提示引导模型后续发起翻页请求
        if (totalRead < lines.length) {
          content.push(`\n... 还有 ${lines.length - totalRead} 行未显示，可使用 offset=${totalRead + 1} 继续读取 ...`);
        }

        return { content: content.join("\n"), isError: false };
      } catch (error) {
        // 7. 捕获 ENOENT（文件不存在）或无读取权限等错误，将错误内容喂给模型
        const message = error instanceof Error ? error.message : String(error);
        return { content: `读取失败: ${message}`, isError: true };
      }
    },
  };
}
