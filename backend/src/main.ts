import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:4200'),
    credentials: true,
  });

  app.setGlobalPrefix(configService.get('API_PREFIX', '/api/v1'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new AuditLogInterceptor());

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}

bootstrap();
