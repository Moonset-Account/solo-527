const models = require('../models');
const bcrypt = require('bcryptjs');

const runSeed = async () => {
  try {
    console.log('Seeding database with initial data...');

    const existingUsers = await models.User.count();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping user seed.');
    } else {
      const users = await models.User.bulkCreate([
        {
          username: 'admin',
          email: 'admin@example.com',
          password_hash: await bcrypt.hash('Admin@123', 10),
          full_name: '系统管理员',
          role: 'admin',
        },
        {
          username: 'assistant1',
          email: 'assistant1@example.com',
          password_hash: await bcrypt.hash('Assistant@123', 10),
          full_name: '张助理',
          role: 'assistant',
        },
        {
          username: 'reviewer1',
          email: 'reviewer1@example.com',
          password_hash: await bcrypt.hash('Reviewer@123', 10),
          full_name: '李律师',
          role: 'reviewer',
        },
      ], { individualHooks: false });

      console.log(`Created ${users.length} users.`);
      console.log('Login credentials:');
      console.log('  admin / Admin@123  (管理员)');
      console.log('  assistant1 / Assistant@123  (法务助理)');
      console.log('  reviewer1 / Reviewer@123  (二审复核人)');
    }

    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeed();
}

module.exports = runSeed;
