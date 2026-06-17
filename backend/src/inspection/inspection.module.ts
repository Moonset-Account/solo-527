import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Inspection, InspectionSchema } from './inspection.schema';
import { InspectionService } from './inspection.service';
import { InspectionController } from './inspection.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Inspection.name, schema: InspectionSchema }])],
  controllers: [InspectionController],
  providers: [InspectionService],
})
export class InspectionModule {}
