import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Notification } from '../../entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [NotificationService, EmailProcessor],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
