import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityInspection } from '../../entities';
import { QualityInspectionService } from './quality.service';
import { QualityInspectionController } from './quality.controller';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QualityInspection]),
    SystemConfigModule,
  ],
  providers: [QualityInspectionService],
  controllers: [QualityInspectionController],
  exports: [QualityInspectionService],
})
export class QualityModule {}
