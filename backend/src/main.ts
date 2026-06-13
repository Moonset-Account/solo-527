import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cors from 'cors';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cors({
    origin: process.env['CORS_ORIGIN'] || '*',
    credentials: true,
  }));
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api');

  const port = parseInt(process.env['PORT'] || '3000', 10);
  await app.listen(port);

  console.log(`Dental Clinic Backend Server is running on port ${port}`);
  console.log(`API Documentation: http://localhost:${port}/api`);
}

bootstrap();
