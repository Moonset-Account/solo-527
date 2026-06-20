import { Module } from '@nestjs/common';

@Module({
  providers: [
    {
      provide: 'CONFIG',
      useValue: {
        jwt: {
          secret: process.env.JWT_SECRET || 'interview-system-secret',
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        },
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
        },
      },
    },
  ],
  exports: ['CONFIG'],
})
export class ConfigModule {}
