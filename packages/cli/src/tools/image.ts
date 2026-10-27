// 第 11 步（加分，TODO）：把生图做成工具 —— 让 agent 能“画漫画分镜”。
// 调用 OpenAI 兼容的 POST {IMAGE_BASE_URL}/images/generations
// 对应 pi：packages/ai/src/images.ts + images-api-registry.ts
import type { AgentTool, AgentToolResult } from "@mini-pi/agent";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * TODO(step11):
 *  - 请求体：{ model: IMAGE_MODEL, prompt, size, n: 1, response_format: "b64_json" }
 *  - 返回里可能是 data[0].b64_json 或 data[0].url，两种都处理
 *  - 存到 generated/<时间>.png，把文件路径告诉模型（别把 base64 塞回上下文！想想为什么）
 */
export function createImageTool(cwd: string): AgentTool<{ prompt: string; size?: string }> {
  return {
    name: "generate_image",
    description: "根据提示词生成一张图片，保存到本地并返回路径",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "画面描述（英文效果通常更好）" },
        size: { type: "string", description: "尺寸，如 1024x1024" },
      },
      required: ["prompt"],
    },
    async execute(args, ctx): Promise<AgentToolResult> {
      // 1. 读取环境变量
      const baseUrl = (process.env.IMAGE_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
      const apiKey = process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || "";
      const model = process.env.IMAGE_MODEL || "dall-e-3";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      // 2. 发起生图请求
      const resp = await fetch(`${baseUrl}/images/generations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          prompt: args.prompt,
          size: args.size ?? "1024x1024",
          n: 1,
          response_format: "b64_json",
        }),
        signal: ctx?.signal,
      });

      if (!resp.ok) {
        let errorMsg = resp.statusText;
        try {
          const errData = await resp.json();
          errorMsg = errData.error?.message || errorMsg;
        } catch { }
        return { content: `生成图片失败: ${errorMsg}`, isError: true };
      }

      const data = (await resp.json()) as any;
      const firstData = data.data?.[0];
      if (!firstData) {
        return { content: "生成图片失败：接口未返回图片数据", isError: true };
      }

      // 3. 处理 b64_json 或 url 两种返回格式
      let imageBuffer: Buffer;
      if (firstData.b64_json) {
        imageBuffer = Buffer.from(firstData.b64_json, "base64");
      } else if (firstData.url) {
        const imageResp = await fetch(firstData.url, { signal: ctx?.signal });
        if (!imageResp.ok) {
          return { content: `下载图片失败: ${imageResp.statusText}`, isError: true };
        }
        imageBuffer = Buffer.from(await imageResp.arrayBuffer());
      } else {
        return { content: "生成图片失败：未找到有效图片数据", isError: true };
      }

      // 4. 递归创建 generated 目录并写入文件
      const generatedDir = path.join(cwd, "generated");
      await fs.mkdir(generatedDir, { recursive: true });
      const filename = `${Date.now()}.png`;
      const filePath = path.join(generatedDir, filename);
      await fs.writeFile(filePath, imageBuffer);

      // 5. 将文件路径返回给模型（千万不要把巨大的 base64 塞回上下文浪费 token）
      return {
        content: `已生成图片并保存至: ${filePath}`,
        isError: false,
      };
    },
  };
}
