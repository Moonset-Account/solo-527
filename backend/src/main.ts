import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  
  app.setGlobalPrefix('api');
  
  await app.listen(process.env.PORT || 3003);
  console.log(`Backend server is running on http://localhost:${process.env.PORT || 3003}`);
}

bootstrap();
