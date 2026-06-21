import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'legal_archive',
  entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  migrationsRun: false,
  logging: process.env.NODE_ENV !== 'production',
  ssl: false,
  connectTimeoutMS: 30000,
  maxQueryExecutionTime: 30000,
  poolSize: 10,
  extra: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },
};

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
export { dataSourceOptions };
