// npm run step2 -- "你的问题"   —— 和 step1 一样，但是一个字一个字地打出来
import { ConfigError, getTextModelConfig, streamChatCompletion } from "@mini-pi/ai";

async function main() {
  const config = getTextModelConfig();
  const question = process.argv.slice(2).join(" ") || "写一首关于猫的四行小诗";
  console.log(`→ 模型：${config.model}（流式）\n`);
  const started = Date.now();
  let firstTokenAt = 0;
  for await (const ev of streamChatCompletion(config, [{ role: "user", content: question }])) {
    if (ev.type === "text_delta") {
      if (!firstTokenAt) firstTokenAt = Date.now();
      process.stdout.write(ev.delta);
    } else if (ev.type === "done") {
      console.log(`\n\n(首字延迟 ${firstTokenAt - started}ms，总耗时 ${Date.now() - started}ms，finish_reason=${ev.finishReason})`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof ConfigError ? `⚠️  ${err.message}` : `❌ 出错了：${err.message}`);
  process.exit(1);
});
