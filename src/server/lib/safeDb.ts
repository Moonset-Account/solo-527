import { TRPCError } from "@trpc/server";

export function safeDbCall<T>(
  ctx: { dbUnavailable?: boolean },
  fallback: T,
  fn: () => Promise<T>,
  label: string = ""
): Promise<T> {
  if (ctx.dbUnavailable) {
    return Promise.resolve(fallback);
  }
  return fn().catch((e) => {
    console.error(`[DB ERROR]${label ? " " + label : ""}:`, e?.message ?? e);
    return fallback;
  });
}

export function assertDbAvailable(ctx: { dbUnavailable?: boolean }, action: string) {
  if (ctx.dbUnavailable) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `当前为 Mock 无数据库模式，无法执行：${action}。请配置 DATABASE_URL 启动 PostgreSQL。`,
    });
  }
}
