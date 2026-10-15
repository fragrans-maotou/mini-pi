import { defineConfig } from "vitest/config";
// npm run verify -- 06 ：跑某一步的验收测试（写完 TODO 之后才会通过）
export default defineConfig({ test: { include: ["tests/steps/**/*.test.ts"] } });
