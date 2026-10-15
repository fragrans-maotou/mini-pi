import { describe, expect, it } from "vitest";
import { SSEParser } from "../src/sse.ts";
import { parseChatStream } from "../src/stream.ts";

describe("第 2 步：SSEParser", () => {
  it("能处理被切成碎片的 chunk", () => {
    const p = new SSEParser();
    const raw = 'data: {"a":1}\n\ndata: {"a":2}\n\ndata: [DONE]\n\n';
    const events = [];
    for (const ch of raw) events.push(...p.push(ch)); // 一个字符一个字符喂
    expect(events.map((e) => e.data)).toEqual(['{"a":1}', '{"a":2}', "[DONE]"]);
  });

  it("支持 \\r\\n、注释行、多行 data 和 flush", () => {
    const p = new SSEParser();
    const evs = p.push(": ping\r\nevent: x\r\ndata: line1\r\ndata: line2\r\n\r\ndata: tail");
    expect(evs).toEqual([{ event: "x", data: "line1\nline2" }]);
    expect(p.flush()).toEqual([{ event: undefined, data: "tail" }]);
  });
});

describe("第 2 步：parseChatStream", () => {
  async function* gen(datas: string[]) {
    for (const data of datas) yield { data };
  }

  it("拼接文本增量", async () => {
    const out = [];
    for await (const e of parseChatStream(
      gen([
        JSON.stringify({ choices: [{ delta: { content: "你" } }] }),
        JSON.stringify({ choices: [{ delta: { content: "好" }, finish_reason: "stop" }] }),
        "[DONE]",
      ]),
    ))
      out.push(e);
    expect(out.at(-1)).toEqual({ type: "done", text: "你好", toolCalls: [], finishReason: "stop" });
  });

  it("拼接分片到达的工具调用参数", async () => {
    let done: any;
    for await (const e of parseChatStream(
      gen([
        JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, id: "c1", function: { name: "read", arguments: '{"pa' } }] } }] }),
        JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'th":"a.txt"}' } }] }, finish_reason: "tool_calls" }] }),
      ]),
    ))
      if (e.type === "done") done = e;
    expect(done.toolCalls[0]).toEqual({ id: "c1", type: "function", function: { name: "read", arguments: '{"path":"a.txt"}' } });
    expect(done.finishReason).toBe("tool_calls");
  });
});
