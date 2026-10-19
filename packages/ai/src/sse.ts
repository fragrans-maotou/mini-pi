// 第 2 步（已实现）：SSE 解析。
// 服务器流式返回的格式长这样（每个事件之间空一行）：
//   data: {"choices":[{"delta":{"content":"你"}}]}
//
//   data: {"choices":[{"delta":{"content":"好"}}]}
//
//   data: [DONE]
// 难点：网络分块（chunk）可能把一行切成两半，所以要自己攒 buffer。
// 对应 pi：pi 用 openai SDK 帮它做了这件事，见 packages/ai/src/api/openai-completions.ts 里的 `for await (const chunk of ...)`

export interface SSEEvent {
  event?: string;
  data: string;
}

/** 纯函数版本：增量喂入文本，吐出已经完整的事件。方便离线测试。 */
export class SSEParser {
  private buffer = "";
  private dataLines: string[] = [];
  private eventName: string | undefined;

  push(chunk: string): SSEEvent[] {
    this.buffer += chunk;
    const out: SSEEvent[] = [];
    let idx: number;
    while ((idx = this.buffer.indexOf("\n")) !== -1) {
      let line = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      const ev = this.handleLine(line);
      if (ev) out.push(ev);
    }
    return out;
  }

  /** 流结束时调用，把最后没有空行结尾的事件也吐出来。 */
  flush(): SSEEvent[] {
    const out: SSEEvent[] = [];
    if (this.buffer) {
      const ev = this.handleLine(this.buffer);
      this.buffer = "";
      if (ev) out.push(ev);
    }
    const last = this.handleLine("");
    if (last) out.push(last);
    return out;
  }

  private handleLine(line: string): SSEEvent | undefined {
    if (line === "") {
      if (this.dataLines.length === 0) return undefined;
      const ev: SSEEvent = { data: this.dataLines.join("\n"), event: this.eventName };
      this.dataLines = [];
      this.eventName = undefined;
      return ev;
    }
    if (line.startsWith(":")) return undefined; // 注释 / 心跳
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "data") this.dataLines.push(value);
    else if (field === "event") this.eventName = value;
    return undefined;
  }
}

/** 把 fetch 的 body（字节流）变成 SSE 事件的异步迭代器。 */
export async function* readSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<SSEEvent> {
  const decoder = new TextDecoder();
  const parser = new SSEParser();
  console.log("body", body);

  for await (const bytes of body as unknown as AsyncIterable<Uint8Array>) {
    yield* parser.push(decoder.decode(bytes, { stream: true }));
  }
  yield* parser.push(decoder.decode());
  yield* parser.flush();
}
