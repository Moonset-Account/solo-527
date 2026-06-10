import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseSurvey } from './house-survey.entity';
import { HouseSurveyService } from './house-survey.service';
import { HouseSurveyController } from './house-survey.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HouseSurvey])],
  controllers: [HouseSurveyController],
  providers: [HouseSurveyService],
  exports: [HouseSurveyService, TypeOrmModule],
})
export class HouseSurveyModule {}
