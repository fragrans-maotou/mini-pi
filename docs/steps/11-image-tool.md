# 11（加分）把生图做成工具

## 学什么
**任何 API 都能变成工具。** 把 OpenAI 兼容的 `POST /images/generations` 包一层，agent 就能自己“画分镜”——直接接到你的 AI 漫画流程：让 agent 先写剧本，再逐格调 `generate_image`。

## 对应 pi 的哪个文件
- [`packages/ai/src/images.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/images.ts)、[`images-api-registry.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/ai/src/images-api-registry.ts) —— pi 给图片 API 也做了一个注册表

## 你要写的代码
- `packages/cli/src/tools/image.ts`：读 `IMAGE_BASE_URL` / `IMAGE_API_KEY` / `IMAGE_MODEL`，调接口，存 PNG，返回路径
- 在 `main.ts` 的 tools 里加上它

## 怎么验证
```bash
npm run verify -- 11     # 离线：mock 了 fetch
# 真实测试（.env 里配 IMAGE_BASE_URL=http://192.168.31.175:7868/v1）
npm run chat   # “画一只戴墨镜的橘猫，四格漫画第一格”
```

## 思考题
- 为什么不能把 base64 图片放回给模型的上下文里？
- 生图很慢（几十秒），怎么让用户在等待时看到进度？（提示：事件）
- 想让 agent 一次画 4 格并保持角色一致，提示词和工具设计上可以怎么做？
