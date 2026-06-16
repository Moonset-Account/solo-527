const { db: memoryDB } = require('../utils/memoryDB');

const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true' || !process.env.MONGODB_URI;

let models = {};

if (USE_MEMORY_DB) {
  console.log('💾 使用内存数据库模式');
  models = memoryDB;
} else {
  console.log('🍃 使用 MongoDB 模式');
  models = {
    User: require('./User'),
    Pet: require('./Pet'),
    AdoptionApplication: require('./AdoptionApplication'),
    TrainingRecord: require('./TrainingRecord'),
    VisitRecord: require('./VisitRecord'),
    FlowRecord: require('./FlowRecord'),
    SafetyReminder: require('./SafetyReminder'),
  };
}

module.exports = models;
