import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigService } from './config.service.js';
import { ConfigController } from './config.controller.js';
import { ConfigSchema } from '../../schemas/config.schema.js';
import { DepartmentSchema } from '../../schemas/department.schema.js';
import { AttachmentSchema } from '../../schemas/attachment.schema.js';
import { LogSchema } from '../../schemas/log.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Config', schema: ConfigSchema },
      { name: 'Department', schema: DepartmentSchema },
      { name: 'Attachment', schema: AttachmentSchema },
      { name: 'Log', schema: LogSchema },
    ]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  ],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
