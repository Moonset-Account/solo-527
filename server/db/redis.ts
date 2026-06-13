import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis(uri?: string) {
  if (client) return client;
  const redisUri = uri || process.env.REDIS_URI || "redis://127.0.0.1:6379";
  client = new Redis(redisUri, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  client.on("error", (e) => {
    if ((e as any).code === "ECONNREFUSED") {
      console.warn("[Redis] Connection refused - running without cache");
    } else {
      console.error("[Redis] Error:", e.message);
    }
  });
  client.connect().catch(() => {});
  return client;
}

export const redisKeys = {
  session: (sid: string) => `session:${sid}`,
  scheduleDate: (date: string) => `schedule:date:${date}`,
  hoursAlertList: "hours:alert:list",
  auditBuffer: "audit:buffer",
  noticeUnreceipt: (date: string) => `notice:unreceipt:${date}`,
  noticeReminder: (noticeId: string) => `notice:reminder:${noticeId}`,
};
