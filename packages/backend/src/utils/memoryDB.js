const { generateSeedData } = require('./seedData');
const { createMemoryModel, store } = require('./memoryModel');

const seedData = generateSeedData();

const db = {
  User: createMemoryModel('users', seedData.users),
  Pet: createMemoryModel('pets', seedData.pets),
  AdoptionApplication: createMemoryModel('adoptionApplications', seedData.adoptionApplications),
  TrainingRecord: createMemoryModel('trainingRecords', seedData.trainingRecords),
  VisitRecord: createMemoryModel('visitRecords', seedData.visitRecords),
  SafetyReminder: createMemoryModel('safetyReminders', seedData.safetyReminders),
  FlowRecord: createMemoryModel('flowRecords', seedData.flowRecords),
};

const initMemoryDB = () => {
  console.log('Memory database initialized with seed data');
  console.log(`  Users: ${seedData.users.length}`);
  console.log(`  Pets: ${seedData.pets.length}`);
  console.log(`  Applications: ${seedData.adoptionApplications.length}`);
  console.log(`  Training records: ${seedData.trainingRecords.length}`);
  console.log(`  Visit records: ${seedData.visitRecords.length}`);
  console.log(`  Safety reminders: ${seedData.safetyReminders.length}`);
  console.log(`  Flow records: ${seedData.flowRecords.length}`);
  return db;
};

module.exports = {
  db,
  initMemoryDB,
  store,
};
