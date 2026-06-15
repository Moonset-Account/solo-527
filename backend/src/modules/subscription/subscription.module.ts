import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '@/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  controllers: [],
  providers: [],
  exports: [],
})
export class SubscriptionModule {}
