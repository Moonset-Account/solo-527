import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DelayReminder } from './delay-reminder.entity';
import { DelayReminderService } from './delay-reminder.service';
import { DelayReminderController } from './delay-reminder.controller';
import { ConstructionStageModule } from '../construction-stage/construction-stage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DelayReminder]),
    forwardRef(() => ConstructionStageModule),
  ],
  controllers: [DelayReminderController],
  providers: [DelayReminderService],
  exports: [DelayReminderService, TypeOrmModule],
})
export class DelayReminderModule {}
