import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityRecord, ActivityRecordSchema } from './activity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ActivityRecord.name, schema: ActivityRecordSchema }]),
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
