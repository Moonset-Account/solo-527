const { sequelize } = require('./connection');
const models = require('../models');

const runMigrations = async () => {
  try {
    console.log('Starting database migrations...');

    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await sequelize.sync({ alter: true });

    console.log('Running SQL setup for PGVector (if extension available)...');
    try {
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('PGVector extension enabled.');
    } catch (e) {
      console.log('PGVector extension not available, will use fallback vector store.');
    }

    console.log('Creating indexes...');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_risk_annotations_low_conf_priority
      ON risk_annotations (is_low_confidence, status, queue_priority DESC)
      WHERE is_low_confidence = true;
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_time
      ON audit_logs (user_id, action, created_at DESC);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_active_severity
      ON alerts (status, severity, created_at DESC)
      WHERE status = 'active';
    `);

    console.log('Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
