import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulesService } from './schedules.service.js';
import { SchedulesController } from './schedules.controller.js';
import { Schedule, ScheduleSchema } from '../../schemas/schedule.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Schedule.name, schema: ScheduleSchema }]),
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
