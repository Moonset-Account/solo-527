import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckinRecordSchema } from './checkin.schema';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'CheckinRecord', schema: CheckinRecordSchema }])],
  providers: [CheckinService],
  controllers: [CheckinController],
  exports: [CheckinService],
})
export class CheckinModule {}
