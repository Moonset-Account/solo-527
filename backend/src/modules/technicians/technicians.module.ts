import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TechnicianSchema } from './technician.schema';
import { TechniciansService } from './technicians.service';
import { TechniciansController } from './technicians.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Technician', schema: TechnicianSchema }])],
  providers: [TechniciansService],
  controllers: [TechniciansController],
  exports: [TechniciansService],
})
export class TechniciansModule {}
