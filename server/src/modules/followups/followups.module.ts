import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowupsController } from './followups.controller';
import { FollowupsService } from './followups.service';
import { Followup, FollowupSchema } from '../../schemas/followup.schema';
import { Appointment, AppointmentSchema } from '../../schemas/appointment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Followup.name, schema: FollowupSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [FollowupsController],
  providers: [FollowupsService],
  exports: [FollowupsService],
})
export class FollowupsModule {}
