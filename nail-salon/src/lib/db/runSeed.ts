import * as dotenv from 'dotenv';
import { seed } from './seed';

dotenv.config();

async function main() {
  console.log('Seeding database...');
  await seed();
  console.log('Database seeded successfully');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
