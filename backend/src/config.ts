import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'training-camp-dev-secret-key-2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
