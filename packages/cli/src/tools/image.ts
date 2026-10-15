// 第 11 步（加分，TODO）：把生图做成工具 —— 让 agent 能“画漫画分镜”。
// 调用 OpenAI 兼容的 POST {IMAGE_BASE_URL}/images/generations
// 对应 pi：packages/ai/src/images.ts + images-api-registry.ts
import type { AgentTool } from "@mini-pi/agent";

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
    async execute(args, ctx) {
      throw new Error("TODO(step11): 实现 generate_image 工具");
    },
  };
}
