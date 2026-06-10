import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import { CommonModule } from './common/common.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { CustomerModule } from './modules/customer/customer.module';
import { OrderModule } from './modules/order/order.module';
import { ProductionModule } from './modules/production/production.module';
import { MaterialModule } from './modules/material/material.module';
import { QualityModule } from './modules/quality/quality.module';
import { ShortageModule } from './modules/shortage/shortage.module';
import { ExportModule } from './modules/export/export.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'qinghe_order',
      entities: Object.values(entities),
      synchronize: true,
      logging: false,
      ssl: false,
    }),
    CommonModule,
    SystemConfigModule,
    UserModule,
    CustomerModule,
    OrderModule,
    ProductionModule,
    MaterialModule,
    QualityModule,
    ShortageModule,
    ExportModule,
  ],
})
export class AppModule {}
