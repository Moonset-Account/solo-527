import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Lead, LeadSchema } from '../../schemas/lead.schema';
import { Followup, FollowupSchema } from '../../schemas/followup.schema';
import { Exception, ExceptionSchema } from '../../schemas/exception.schema';
import { RedisModule } from '../../shared/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lead.name, schema: LeadSchema },
      { name: Followup.name, schema: FollowupSchema },
      { name: Exception.name, schema: ExceptionSchema },
    ]),
    RedisModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
