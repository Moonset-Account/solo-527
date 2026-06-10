import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 青禾会员触达台 后端服务已启动: http://localhost:${port}`);
  console.log(`📌 当前环境: ${process.env.ENV_LABEL || 'dev'}`);
}
bootstrap();
