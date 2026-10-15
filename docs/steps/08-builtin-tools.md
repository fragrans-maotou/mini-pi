# 08 内置工具 read / write / bash

## 学什么
有了这三个工具，agent 就能写代码了（pi 再加一个 `edit`）。真实工具要考虑：
- **截断**：一个 10MB 的日志直接塞给模型会撑爆上下文
- **安全**：不能写到工作目录外；跑命令前要问用户（用第 7 步的 `beforeToolCall`）
- **超时与中止**

## 对应 pi 的哪个文件
- [`packages/coding-agent/src/core/tools/read.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/coding-agent/src/core/tools/read.ts)
- [`packages/coding-agent/src/core/tools/write.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/coding-agent/src/core/tools/write.ts)
- [`packages/coding-agent/src/core/tools/bash.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/coding-agent/src/core/tools/bash.ts)、[`core/bash-executor.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/coding-agent/src/core/bash-executor.ts)
- [`packages/coding-agent/src/core/tools/truncate.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/coding-agent/src/core/tools/truncate.ts) —— 截断策略

## 你要写的代码
- `packages/cli/src/tools/read.ts`、`write.ts`、`bash.ts`（包括 `confirmBash`）
- 然后 `npm run chat` 就能用了！`packages/cli/src/main.ts` 已经帮你接好线

## 怎么验证
```bash
npm run verify -- 08
npm run chat      # 试试：“帮我建一个 hello.txt，写入今天的日期”
```

## 思考题
- bash 输出截断时，为什么保留**尾部**通常比保留头部有用？
- 只靠“问用户 y/N”够安全吗？还能怎么做（白名单、沙箱）？
