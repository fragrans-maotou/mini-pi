# 09 会话保存 JSONL

## 学什么
关掉终端，对话就没了？把每条消息**追加**到一个 `.jsonl` 文件（一行一个 JSON）。
为什么是 JSONL 而不是一个大 JSON？因为只追加、不重写——崩溃了也最多丢最后一行。
pi 的每行都有 `id` 和 `parentId`，于是会话是一棵**树**：可以回到某一条消息重新分叉。

## 对应 pi 的哪个文件
- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/fragrans-maotou/pi/blob/main/packages/coding-agent/src/core/session-manager.ts) —— 搜 `SessionEntry`、`appendMessage`、`buildSessionContext`

## 你要写的代码
- `packages/cli/src/session.ts`：`SessionManager`
- `packages/cli/src/main.ts`：订阅 `message_end` 保存消息；支持 `--resume <file>`

## 怎么验证
```bash
npm run verify -- 09
npm run chat   # 聊两句，退出，再用 --resume 打开，问“我刚才说了什么？”
```

## 思考题
- 进阶：实现“从第 N 条消息分叉”，只需要改哪里？
- 会话文件里有用户的代码和命令输出，存放时要注意什么？
