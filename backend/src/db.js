import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/rental_apartment';
const url = new URL(databaseUrl);

const adapter = new PrismaMariaDb({
  host: url.hostname || 'localhost',
  port: Number(url.port) || 3306,
  user: url.username || 'root',
  password: decodeURIComponent(url.password) || undefined,
  database: url.pathname.replace(/^\//, '') || 'rental_apartment',
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });
export default prisma;
