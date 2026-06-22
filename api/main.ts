import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import dotenv from 'dotenv';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { sandboxMiddleware } from './common/middleware/sandbox.middleware.js';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');

  app.use(sandboxMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Order Fulfillment API')
    .setDescription('订单履约系统 API 文档')
    .setVersion('1.0')
    .addHeader('x-sandbox-mode', '沙箱模式开关', { required: false })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`);
    console.log(`API docs: http://localhost:${PORT}/api/docs`);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received');
    await app.close();
    console.log('Server closed');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received');
    await app.close();
    console.log('Server closed');
    process.exit(0);
  });
}

bootstrap();
