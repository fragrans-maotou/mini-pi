// 第 9 步（TODO）：会话保存为 JSONL。
// 对应 pi：packages/coding-agent/src/core/session-manager.ts
// pi 的每一行是一个 entry：{ type, id, parentId, timestamp, ... }，parentId 让会话变成一棵树（可以分叉）。
// 我们先做“一条线”的版本，parentId 留着，进阶再做分叉。
import type { Message } from "@mini-pi/ai";

export type SessionEntry =
  | { type: "session"; id: string; timestamp: string; cwd: string; version: 1 }
  | { type: "message"; id: string; parentId: string | null; timestamp: string; message: Message }
  | { type: "compaction"; id: string; parentId: string | null; timestamp: string; summary: string; firstKeptEntryId: string };

export class SessionManager {
  /** TODO(step09): 新建会话文件（默认放 .mini-pi/sessions/<时间>.jsonl），写入第一行 session header */
  static create(cwd: string, dir?: string): SessionManager {
    throw new Error("TODO(step09): 实现 SessionManager.create");
  }

  /** TODO(step09): 打开已有的会话文件，逐行 JSON.parse 读出所有 entry（坏行跳过） */
  static open(file: string): SessionManager {
    throw new Error("TODO(step09): 实现 SessionManager.open");
  }

  /** 会话文件路径 */
  get file(): string {
    throw new Error("TODO(step09)");
  }

  /** TODO(step09): 追加一条消息：生成 id，parentId=上一条的 id，appendFileSync 一行 JSON。返回 id */
  appendMessage(message: Message): string {
    throw new Error("TODO(step09): 实现 appendMessage");
  }

  /** TODO(step10): 追加一条压缩记录 */
  appendCompaction(summary: string, firstKeptEntryId: string): string {
    throw new Error("TODO(step10): 实现 appendCompaction");
  }

  /** 所有 entry */
  getEntries(): SessionEntry[] {
    throw new Error("TODO(step09)");
  }

  /**
   * TODO(step09): 还原给模型看的消息列表。
   * 第 10 步后：如果有 compaction，就是 [摘要消息, ...firstKeptEntryId 之后的消息]
   */
  buildMessages(): Message[] {
    throw new Error("TODO(step09): 实现 buildMessages");
  }
}
