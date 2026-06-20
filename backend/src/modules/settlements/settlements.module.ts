import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { Settlement } from './entities/settlement.entity';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Settlement]),
    OrdersModule,
    UsersModule,
  ],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [TypeOrmModule, SettlementsService],
})
export class SettlementsModule {}
