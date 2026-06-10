import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConstructionStage } from './construction-stage.entity';
import { ConstructionStageService } from './construction-stage.service';
import { ConstructionStageController } from './construction-stage.controller';
import { DelayReminderModule } from '../delay-reminder/delay-reminder.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConstructionStage]),
    forwardRef(() => DelayReminderModule),
  ],
  controllers: [ConstructionStageController],
  providers: [ConstructionStageService],
  exports: [ConstructionStageService, TypeOrmModule],
})
export class ConstructionStageModule {}
