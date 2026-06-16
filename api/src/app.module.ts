import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface.js';
import { RoomsModule } from './modules/rooms/rooms.module.js';
import { AppointmentsModule } from './modules/appointments/appointments.module.js';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module.js';
import { ContractsModule } from './modules/contracts/contracts.module.js';
import { SettlementsModule } from './modules/settlements/settlements.module.js';
import { ExceptionsModule } from './modules/exceptions/exceptions.module.js';
import { MessagesModule } from './modules/messages/messages.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { VacancyModule } from './modules/vacancy/vacancy.module.js';
import { ConfigModule as BizConfigModule } from './modules/config/config.module.js';
import { SeederModule } from './common/seeder.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'rental_service'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    RoomsModule,
    AppointmentsModule,
    WorkOrdersModule,
    ContractsModule,
    SettlementsModule,
    ExceptionsModule,
    MessagesModule,
    PaymentsModule,
    VacancyModule,
    BizConfigModule,
    SeederModule,
  ],
})
export class AppModule {}
