// 读取 .env 和环境变量。不依赖 dotenv，自己解析几行就够了。
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface TextModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/** 把项目根目录的 .env 读进 process.env（已存在的环境变量优先）。 */
export function loadDotEnv(file = resolve(process.cwd(), ".env")): void {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

export class ConfigError extends Error {}

/** 读取文本模型配置；缺了就抛出一个看得懂的中文错误。 */
export function getTextModelConfig(): TextModelConfig {
  loadDotEnv();
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const apiKey = process.env.OPENAI_API_KEY || "";
  const model = process.env.MODEL || "";
  const missing: string[] = [];
  if (!apiKey || apiKey.includes("在这里填")) missing.push("OPENAI_API_KEY");
  if (!model) missing.push("MODEL");
  if (missing.length) {
    throw new ConfigError(
      `缺少配置：${missing.join("、")}\n` +
        `请先复制一份配置文件：cp .env.example .env\n` +
        `然后在 .env 里填上 OPENAI_BASE_URL / OPENAI_API_KEY / MODEL（任何 OpenAI 兼容接口都行）。\n` +
        `本地服务不需要 key 的话，随便填一个非空字符串，比如 OPENAI_API_KEY=local`,
    );
  }
  return { baseUrl, apiKey, model };
}
