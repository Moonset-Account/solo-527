export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  sync: boolean;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppConfig {
  port: number;
  uploadDir: string;
  frontendUrl: string;
}

export default () => ({
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    database: process.env.DB_DATABASE || 'legal_archive',
    sync: process.env.NODE_ENV !== 'production',
  } as DatabaseConfig,
  jwt: {
    secret: process.env.JWT_SECRET || 'legal-archive-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  } as JwtConfig,
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  } as AppConfig,
});
