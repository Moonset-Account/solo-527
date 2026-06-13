import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderTask } from './entities/reminder-task.entity';
import { ReminderService } from './services/reminder.service';
import { ReminderController } from './controllers/reminder.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReminderTask])],
  controllers: [ReminderController],
  providers: [ReminderService],
  exports: [ReminderService],
})
export class ReminderModule {}
