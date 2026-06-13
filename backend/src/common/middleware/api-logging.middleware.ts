import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiLogService } from '../../modules/log/services/api-log.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ApiLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiLoggingMiddleware.name);

  constructor(private readonly apiLogService: ApiLogService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;

    let requestBody: string | undefined;
    if (req.body && Object.keys(req.body).length > 0) {
      try {
        requestBody = JSON.stringify(req.body);
      } catch {
        requestBody = String(req.body);
      }
    }

    const userId = (req as any).user?.id;

    const logEntry = await this.apiLogService.createRequestLog({
      method,
      url: originalUrl,
      headers: {
        'user-agent': headers['user-agent'],
        'content-type': headers['content-type'],
      },
      requestBody,
      userId,
      ipAddress: ip,
      maxRetries: 3,
    });

    (req as any).requestId = requestId;
    (req as any).apiLogId = logEntry.id;

    const originalSend = res.send.bind(res);
    let responseBody: string | undefined;

    res.send = function (body: any) {
      try {
        responseBody = typeof body === 'string' ? body : JSON.stringify(body);
      } catch {
        responseBody = String(body);
      }
      return originalSend(body);
    };

    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
      const isRetryable = !isSuccess && this.isRetryableError(res.statusCode);

      try {
        await this.apiLogService.updateRequestLog(logEntry.id, {
          responseBody,
          statusCode: res.statusCode,
          duration,
          isSuccess,
          isRetryable,
        });
      } catch (error: any) {
        this.logger.error(`Failed to update API log: ${error?.message || 'Unknown error'}`);
      }
    });

    next();
  }

  private isRetryableError(statusCode: number): boolean {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(statusCode);
  }
}
