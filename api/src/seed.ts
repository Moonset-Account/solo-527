import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { SeederService } from './common/seeder.service.js';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeederService);
  try {
    await seeder.seed();
    console.log('Seed data inserted successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
  }
}
seed();
