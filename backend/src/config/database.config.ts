import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = registerAs('database', () => ({
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432', 10),
  username: process.env['DB_USER'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'postgres123',
  database: process.env['DB_NAME'] || 'dental_clinic',
}));

export const typeOrmConfig = (): TypeOrmModuleOptions => {
  const config = databaseConfig();
  return {
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: process.env['NODE_ENV'] === 'development',
    ssl: process.env['NODE_ENV'] === 'production',
    extra: {
      max: 50,
      connectionTimeoutMillis: 30000,
    },
  };
};
