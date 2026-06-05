export const config = {
  port: parseInt(process.env.PORT || '3001'),
  jwt: {
    secret: process.env.JWT_SECRET || 'agricultural-machinery-secret-key-2024',
    expiresIn: '24h'
  },
  database: {
    filename: process.env.DB_FILENAME || './data/agricultural.db'
  },
  price: {
    basePricePerHour: 100,
    multipliers: {
      self_use: 0.7,
      cooperative_subsidy: 0.5,
      cross_village: 1.3
    }
  },
  rain: {
    cancelThreshold: 0.7,
    checkInterval: '0 * * * *'
  }
};
