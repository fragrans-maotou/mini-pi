import { defineConfig } from "vitest/config";
// npm test：只跑“已经实现好”的离线测试（step01/02 + fake provider）
export default defineConfig({ test: { include: ["packages/*/test/**/*.test.ts"] } });
