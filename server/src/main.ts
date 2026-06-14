import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

process.on('unhandledRejection', (reason: any) => {
  console.warn('[UnhandledRejection]', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.warn('[UncaughtException]', err?.message || err);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    bufferLogs: false,
  });
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log('================================================');
  console.log(` Server is running on http://localhost:${port}`);
  console.log('================================================');
  const url = await app.getUrl();
  console.log(' Listening at:', url);
}
bootstrap().catch((err) => {
  console.error('[Bootstrap Failed]', err.message);
  process.exit(1);
});
