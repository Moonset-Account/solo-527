import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const { seed } = await import('./seed');
  const { closeDb } = await import('./index');
  console.log('Seeding database...');
  await seed();
  console.log('Database seeded successfully');
  await closeDb();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
