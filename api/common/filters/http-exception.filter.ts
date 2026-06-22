import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | object | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as { message?: string | string[]; error?: string };
        if (Array.isArray(resp.message)) {
          message = resp.message.join(', ');
        } else if (resp.message) {
          message = resp.message;
        }
        error = resp.error || exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack);
    }

    this.logger.warn(
      `[${request.method}] ${request.url} - ${status} - ${message}`,
    );

    response.status(status).json({
      success: false,
      data: null,
      message,
      error,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
