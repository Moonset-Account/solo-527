import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { PointsRecord, PointsRecordSchema } from './points.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PointsRecord.name, schema: PointsRecordSchema }]),
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
