// npm run step1 -- "你的问题"
import { chatCompletion, ConfigError, getTextModelConfig } from "@mini-pi/ai";

async function main() {
  const config = getTextModelConfig();
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

main().catch((err) => {
  console.error(err instanceof ConfigError ? `⚠️  ${err.message}` : `❌ 出错了：${err.message}`);
  process.exit(1);
});
