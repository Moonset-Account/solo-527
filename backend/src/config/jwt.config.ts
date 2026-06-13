import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env['JWT_SECRET'] || 'dental-clinic-jwt-secret-key-2024',
  expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
}));
