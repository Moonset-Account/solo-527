import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevisitChurn } from './entities/revisit-churn.entity';
import { RevisitChurnService } from './services/revisit-churn.service';
import { RevisitChurnController } from './controllers/revisit-churn.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RevisitChurn])],
  controllers: [RevisitChurnController],
  providers: [RevisitChurnService],
  exports: [RevisitChurnService],
})
export class RevisitChurnModule {}
