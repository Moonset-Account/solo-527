export const config = {
  port: parseInt(process.env.PORT || '3000'),
  jwt: {
    secret: process.env.JWT_SECRET || 'agricultural-machinery-secret-key-2024',
    expiresIn: '24h'
  },
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agricultural_coop'
  },
  price: {
    basePricePerHour: 100,
    multipliers: {
      member: 0.7,
      subsidy: 0.5,
      commercial: 1.3
    }
  },
  rain: {
    cancelThreshold: 0.7,
    checkInterval: '0 * * * *'
  },
  upload: {
    dir: 'uploads',
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg']
  }
};
