import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    bodyParser: true,
  });

  app.use((req: any, res: any, next: any) => {
    const path = req.url;
    if (path.startsWith('/auth') || path.startsWith('/contracts') ||
        path.startsWith('/approval') || path.startsWith('/conflicts') ||
        path.startsWith('/notifications') || path.startsWith('/files') ||
        path.startsWith('/callbacks')) {
      req.url = '/api' + path;
    }
    next();
  });

  const port = parseInt(process.env.PORT || '3005', 10);

  app.setGlobalPrefix('api', { exclude: ['uploads/(.*)'] });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('法务合同电子归档系统 API')
    .setDescription('法务助理合同盖章电子归档库后端API文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  await app.listen(port);
  console.log(`\n🚀 法务合同归档系统启动成功`);
  console.log(`📡 API地址: http://localhost:${port}/api`);
  console.log(`📖 Swagger文档: http://localhost:${port}/api/docs\n`);
}

bootstrap();
