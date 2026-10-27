// 第 10 步（TODO）：上下文压缩。
// 对应 pi：packages/coding-agent/src/core/compaction/compaction.ts
// 思路：对话太长 → 把“旧的部分”交给模型写一段摘要 → 以后只发 [摘要 + 最近几轮]。
import type { Context, Message, Model, StreamFunction } from "@mini-pi/ai";

/**
 * TODO(step10): 粗略估算 token 数（pi 用 字符数/4 这种近似，见 packages/ai/src/utils/estimate.ts）
 * 业内通常用（JSON 字符串长度 / 4）作为经验估算值，既快速又无需引入昂贵的本地 tokenizer。
 */
export function estimateTokens(messages: Message[]): number {
  return Math.ceil(JSON.stringify(messages).length / 4);
}

/**
 * TODO(step10): 超过 contextWindow - reserveTokens 就该压缩了
 * reserveTokens 为模型生成回复和下一轮用户输入预留安全余量（默认 4000）。
 */
export function shouldCompact(
  messages: Message[],
  contextWindow: number,
  reserveTokens = 4000,
): boolean {
  return estimateTokens(messages) > contextWindow - reserveTokens;
}

/**
 * TODO(step10): 找切分点：从后往前累加，保留最近约 keepRecentTokens 的消息。
 * 规则：切分点必须落在 user 消息上（不能把 assistant 的 toolCall 和对应的 toolResult 拆开！）
 * 返回“保留部分”的起始下标。
 */
export function findCutPoint(messages: Message[], keepRecentTokens: number): number {
  let accumulatedTokens = 0;
  let cut = 0;

  // 1. 从后往前累加 token，找到不超预算的候选切分点
  for (let i = messages.length - 1; i >= 0; i--) {
    const t = estimateTokens([messages[i]]);
    if (accumulatedTokens + t > keepRecentTokens) {
      cut = i + 1;
      break;
    }
    accumulatedTokens += t;
  }

  // 2. 边界检查：如果全部消息都不超预算，从 0 开始保留
  if (cut <= 0) return 0;
  if (cut >= messages.length) cut = messages.length - 1;

  // 3. 寻找落在 user 消息上的切分点
  //    优先向后移动（保证总 token 严格不超过 keepRecentTokens）
  let userIndex = cut;
  while (userIndex < messages.length && messages[userIndex].role !== "user") {
    userIndex++;
  }

  //    如果向后没找到 user 消息，则向前回退寻找最近的 user 消息
  if (userIndex >= messages.length) {
    userIndex = cut;
    while (userIndex >= 0 && messages[userIndex].role !== "user") {
      userIndex--;
    }
  }

  return Math.max(0, userIndex);
}

/**
 * TODO(step10): 调模型把 messages 总结成一段中文摘要（目标、做过的事、关键文件、下一步）
 * 调用模型对被切除的历史对话进行提炼总结，生成一段结构化中文摘要。
 */
export async function summarize(
  messages: Message[],
  model: Model,
  streamFn: StreamFunction,
): Promise<string> {
  const prompt = [
    "请将以下对话历史总结为一段简明扼要的中文摘要，用于作为后续对话的上下文参考。",
    "摘要必须明确包含以下四部分内容：",
    "1. 目标：用户最初想要做什么",
    "2. 做过的事：已经完成了哪些步骤或尝试",
    "3. 关键文件：涉及到的关键文件路径或配置",
    "4. 下一步：接下来需要继续做什么",
  ].join("\n");

  const context: Context = {
    systemPrompt: "你是一个专业的对话总结助手，擅长提炼精简且信息密度高的对话摘要。",
    messages: [
      ...messages,
      {
        role: "user",
        content: prompt,
        timestamp: Date.now(),
      },
    ],
  };

  let summaryText = "";

  for await (const event of streamFn(model, context)) {
    if (event.type === "text_delta") {
      summaryText += event.delta;
    } else if (event.type === "done") {
      const textBlock = event.message.content.find((c) => c.type === "text");
      if (textBlock && textBlock.type === "text" && !summaryText) {
        summaryText = textBlock.text;
      }
    }
  }

  return summaryText.trim();
}
