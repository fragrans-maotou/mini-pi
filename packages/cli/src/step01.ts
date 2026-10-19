// npm run step1 -- "你的问题"
import { chatCompletion, ConfigError, getTextModelConfig } from "@mini-pi/ai";
import type { OpenAIChatMessage } from "@mini-pi/ai";

async function main() {
  const config = getTextModelConfig();
  console.log("process.argv", process.argv);
  const question = process.argv.slice(2).join(" ") || "用一句话介绍一下你自己";
  console.log(`→ 模型：${config.model} @ ${config.baseUrl}`);
  console.log(`→ 问题：${question}\n`);
  const result = await chatCompletion(config, [
    { role: "system", content: "你是一个简洁友好的助手，用中文回答。" },
    { role: "user", content: question },
  ]);
  console.log(result.text);
  console.log(`\n(finish_reason=${result.finishReason}, tokens=${result.usage?.total_tokens ?? "?"})`);
}

async function chatMain() {
  const config = getTextModelConfig();
  const isLinkContext = process.argv.slice(2).join(" ") // true false
  const question = ["我叫猫头，记住了", "我叫什么？"]

  let messages: OpenAIChatMessage[] = [
    { role: "system", content: "你是一个简洁友好的助手，用中文回答。" },
  ]

  for (const q of question) {

    if (!(isLinkContext === "true")) {
      // 非记忆模式
      messages = []
      messages.push({ role: "user", content: q })

    } else {
      // 记忆模式
      messages.push({ role: "user", content: q })
    }

    const result = await chatCompletion(config, messages);
    messages.push({ role: 'assistant', content: result.text })
    console.log(result.text);
  }


}



chatMain().catch((err) => {
  console.error(err instanceof ConfigError ? `⚠️  ${err.message}` : `❌ 出错了：${err.message}`);
  process.exit(1);
});



