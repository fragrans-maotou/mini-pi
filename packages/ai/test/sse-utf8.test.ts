import { describe, expect, it } from "vitest";
import { readSSE } from "../src/sse.ts";
describe("第 1 步：SSEUTF8", () => {
  it("可以处理utf8", () => {
    const text = "你好\n\n"
    const utf8 = new TextEncoder().encode(text);
    // 从“你”字的3个字节的中间切开，看sse是否能处理
    let firstUtf8Char = []
    let secondUtf8Char = []

    for (let i = 0; i < utf8.length; i++) {
      if (i < 2) {
        firstUtf8Char.push(utf8[i])
      }
      else {
        secondUtf8Char.push(utf8[i])
      }
    }

    // 喂给readSSE
    console.log(new Uint8Array(firstUtf8Char))
    console.log(new Uint8Array(secondUtf8Char))

    const reader = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(firstUtf8Char))
        controller.enqueue(new Uint8Array(secondUtf8Char))
        controller.close()
      },
    })

    console.log("reader", reader);

    const a = readSSE(reader)
    console.log("a", a);
  })
})