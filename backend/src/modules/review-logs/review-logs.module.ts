import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewLogsService } from './review-logs.service';
import { ReviewLogsController } from './review-logs.controller';
import { ReviewLog, ReviewLogSchema } from './schemas/review-log.schema';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReviewLog.name, schema: ReviewLogSchema },
    ]),
    UsersModule,
    JwtModule,
  ],
  controllers: [ReviewLogsController],
  providers: [ReviewLogsService],
  exports: [ReviewLogsService, MongooseModule],
})
export class ReviewLogsModule {}
