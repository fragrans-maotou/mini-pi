// 第 4 步（TODO）：provider 注册表。
// 对应 pi：packages/ai/src/compat.ts 里的 registerApiProvider / getApiProvider / stream
//
// 思路：一个 Map<api 名字, StreamFunction>。上层只调 stream(model, context)，
// registry 根据 model.api 找到对应 provider。新增厂商 = 注册一个新函数，别的不动。
import type { AssistantMessage, Context, Model, StreamFunction, StreamOptions, AssistantMessageEvent } from "./types.ts";

/** TODO(step04): 注册一个 provider（同名覆盖）。 */
export function registerProvider(api: string, fn: StreamFunction): void {
  throw new Error("TODO(step04): 实现 registerProvider");
}

/** TODO(step04): 查找 provider，找不到返回 undefined。 */
export function getProvider(api: string): StreamFunction | undefined {
  throw new Error("TODO(step04): 实现 getProvider");
}

/** TODO(step04): 统一入口：按 model.api 找 provider 并转发；找不到时抛出中文错误。 */
export function stream(model: Model, context: Context, options?: StreamOptions): AsyncIterable<AssistantMessageEvent> {
  throw new Error("TODO(step04): 实现 stream");
}

/** TODO(step04): 非流式便利函数：消费 stream()，返回 done/error 事件里的那条 AssistantMessage。 */
export async function complete(model: Model, context: Context, options?: StreamOptions): Promise<AssistantMessage> {
  throw new Error("TODO(step04): 实现 complete");
}
