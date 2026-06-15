import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import * as entities from './entities';

config();

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DATABASE_HOST', 'localhost'),
  port: configService.get('DATABASE_PORT', 5432),
  username: configService.get('DATABASE_USER', 'billing_user'),
  password: configService.get('DATABASE_PASSWORD', 'billing_password'),
  database: configService.get('DATABASE_NAME', 'subscription_billing'),
  entities: Object.values(entities),
  migrations: ['dist/database/migrations/*.js'],
  synchronize: true,
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
  extra: {
    max: 20,
    connectionTimeoutMillis: 5000,
  },
};

export default new DataSource(dataSourceOptions);
