import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './database/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { LeasesModule } from './modules/leases/leases.module';
import { BillsModule } from './modules/bills/bills.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { RoomStatusLogsModule } from './modules/room-status-logs/room-status-logs.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    AuthModule,
    UsersModule,
    PropertiesModule,
    LeasesModule,
    BillsModule,
    DepositsModule,
    PricingModule,
    RoomStatusLogsModule,
    TicketsModule,
    AuditLogsModule,
    ExportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
