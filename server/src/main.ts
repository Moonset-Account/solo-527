import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  app.setGlobalPrefix(process.env.API_PREFIX || '/api');
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }));
  
  const config = new DocumentBuilder()
    .setTitle('青禾订单履约台 API')
    .setDescription('印刷厂订单一体化管理台接口文档')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`青禾订单履约台后端服务已启动: http://localhost:${port}`);
  console.log(`API文档: http://localhost:${port}/api/docs`);
}

bootstrap();
