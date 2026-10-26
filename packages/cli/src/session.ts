// 第 9 步（TODO）：会话保存为 JSONL。
// 对应 pi：packages/coding-agent/src/core/session-manager.ts
// pi 的每一行是一个 entry：{ type, id, parentId, timestamp, ... }，parentId 让会话变成一棵树（可以分叉）。
// 我们先做“一条线”的版本，parentId 留着，进阶再做分叉。
import type { Message } from "@mini-pi/ai";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

export type SessionEntry =
  | { type: "session"; id: string; timestamp: string; cwd: string; version: 1 }
  | { type: "message"; id: string; parentId: string | null; timestamp: string; message: Message }
  | { type: "compaction"; id: string; parentId: string | null; timestamp: string; summary: string; firstKeptEntryId: string };

export class SessionManager {
  private filePath: string;
  private entries: SessionEntry[] = [];

  constructor(filePath: string, entries: SessionEntry[] = []) {
    this.filePath = filePath;
    this.entries = entries;
  }

  /** TODO(step09): 新建会话文件（默认放 .mini-pi/sessions/<时间>.jsonl），写入第一行 session header */
  static create(cwd: string, dir?: string): SessionManager {
    const dirPath = dir ? path.resolve(dir) : path.join(cwd, ".mini-pi", "sessions");
    mkdirSync(dirPath, { recursive: true });

    const now = new Date();
    const timestamp = now.toISOString();
    const fileName = `${timestamp.replace(/[:.]/g, "-")}.jsonl`;
    const filePath = path.join(dirPath, fileName);

    const sessionId = randomUUID();
    const sessionEntry: SessionEntry = {
      type: "session",
      id: sessionId,
      timestamp,
      cwd,
      version: 1,
    };

    appendFileSync(filePath, JSON.stringify(sessionEntry) + "\n", "utf-8");
    return new SessionManager(filePath, [sessionEntry]);
  }

  /** TODO(step09): 打开已有的会话文件，逐行 JSON.parse 读出所有 entry（坏行跳过） */
  static open(file: string): SessionManager {
    const filePath = path.resolve(file);
    const content = readFileSync(filePath, "utf-8");
    const entries: SessionEntry[] = [];

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const entry = JSON.parse(trimmed) as SessionEntry;
        entries.push(entry);
      } catch {
        // 坏行跳过
        continue;
      }
    }

    return new SessionManager(filePath, entries);
  }

  /** 会话文件路径 */
  get file(): string {
    return this.filePath;
  }

  /** TODO(step09): 追加一条消息：生成 id，parentId=上一条的 id，appendFileSync 一行 JSON。返回 id */
  appendMessage(message: Message): string {
    const id = randomUUID();
    const parentId = this.entries.length > 0 ? this.entries[this.entries.length - 1].id : null;
    const timestamp = new Date().toISOString();

    const entry: SessionEntry = {
      type: "message",
      id,
      parentId,
      timestamp,
      message,
    };

    this.entries.push(entry);
    appendFileSync(this.filePath, JSON.stringify(entry) + "\n", "utf-8");
    return id;
  }

  /** TODO(step10): 追加一条压缩记录 */
  appendCompaction(summary: string, firstKeptEntryId: string): string {
    const id = randomUUID();
    const parentId = this.entries.length > 0 ? this.entries[this.entries.length - 1].id : null;
    const timestamp = new Date().toISOString();

    const entry: SessionEntry = {
      type: "compaction",
      id,
      parentId,
      timestamp,
      summary,
      firstKeptEntryId,
    };

    this.entries.push(entry);
    appendFileSync(this.filePath, JSON.stringify(entry) + "\n", "utf-8");
    return id;
  }

  /** 所有 entry */
  getEntries(): SessionEntry[] {
    return this.entries;
  }

  /**
   * 还原给模型看的消息列表。
   * 如果有 compaction 记录，返回 [摘要消息, ...firstKeptEntryId 之后保留的消息]；
   * 没有则返回全部 message 类型的消息。
   */
  buildMessages(): Message[] {
    // 1. 从后往前找到最后一条有效 compaction 记录
    let lastCompaction: (SessionEntry & { type: "compaction" }) | undefined;
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const entry = this.entries[i];
      if (entry.type === "compaction") {
        lastCompaction = entry;
        break;
      }
    }

    // 2. 如果从未发生过压缩，直接返回所有 message
    if (!lastCompaction) {
      const messages: Message[] = [];
      for (const entry of this.entries) {
        if (entry.type === "message") {
          messages.push(entry.message);
        }
      }
      return messages;
    }

    // 3. 如果发生过压缩：
    //    第一条消息是一段带上下文的【历史摘要】
    const summaryMessage: Message = {
      role: "user",
      content: `[历史上下文摘要]\n${lastCompaction.summary}`,
      timestamp: Date.now(),
    };

    //    后续只保留从 firstKeptEntryId 开始及之后的真实消息
    const keptMessages: Message[] = [];
    let startKeeping = false;

    for (const entry of this.entries) {
      if (entry.id === lastCompaction.firstKeptEntryId) {
        startKeeping = true;
      }
      if (startKeeping && entry.type === "message") {
        keptMessages.push(entry.message);
      }
    }

    return [summaryMessage, ...keptMessages];
  }
}
