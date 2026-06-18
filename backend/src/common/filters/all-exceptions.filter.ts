import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorMessage =
      typeof message === 'string'
        ? message
        : (message as any)?.message || 'Unknown error';

    this.logger.error(
      `[${request.method}] ${request.url} -> ${status}: ${errorMessage}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      code: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
      success: false,
    });
  }
}
