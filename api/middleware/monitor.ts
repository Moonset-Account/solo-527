import { type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { db, uuidv4 } from '../db/database.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const endpoint = `${req.method} ${req.path}`;

  res.on('finish', () => {
    const latencyMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const errorMessage = (res.locals?.errorMessage as string | undefined) ?? undefined;
    const userId = req.user?.userId ?? null;
    const model = (res.locals?.model as string) || 'n/a';
    const promptTokens = (res.locals?.promptTokens as number) ?? 0;
    const completionTokens = (res.locals?.completionTokens as number) ?? 0;
    const totalTokens = promptTokens + completionTokens;

    try {
      const insert = db.prepare(`
        INSERT INTO api_call_logs
          (id, endpoint, model, prompt_tokens, completion_tokens, total_tokens, latency_ms, status_code, error_message, user_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(
        uuidv4(),
        endpoint,
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        latencyMs,
        statusCode,
        errorMessage ?? null,
        userId,
        new Date().toISOString(),
      );
    } catch {
      // 忽略日志插入错误，避免影响主流程
    }
  });

  next();
}

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: '登录尝试次数过多，请 1 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const extractionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: '抽取请求过于频繁，请 1 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: '请求次数过多，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

export function setResponseMetadata(req: Request, res: Response, next: NextFunction): void {
  res.locals.promptTokens = 0;
  res.locals.completionTokens = 0;
  res.locals.model = 'n/a';
  next();
}

export default {
  requestLogger,
  setResponseMetadata,
  loginLimiter,
  extractionLimiter,
  generalLimiter,
};
