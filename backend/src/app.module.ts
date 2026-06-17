import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BillsModule } from './bills/bills.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { InspectionModule } from './inspection/inspection.module';
import { RoomPricingModule } from './room-pricing/room-pricing.module';
import { AccessExceptionsModule } from './access-exceptions/access-exceptions.module';
import { ConfigItemsModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    BillsModule,
    MaintenanceModule,
    InspectionModule,
    RoomPricingModule,
    AccessExceptionsModule,
    ConfigItemsModule,
  ],
})
export class AppModule {}
