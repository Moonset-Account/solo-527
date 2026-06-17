import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HazardousLabel, HazardousLabelSchema } from './schemas/hazardous.schema';
import { HazardousService } from './hazardous.service';
import { HazardousController } from './hazardous.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HazardousLabel.name, schema: HazardousLabelSchema }]),
  ],
  controllers: [HazardousController],
  providers: [HazardousService],
  exports: [HazardousService],
})
export class HazardousModule {}
