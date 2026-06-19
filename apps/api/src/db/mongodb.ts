import mongoose from 'mongoose';
import { config } from '../config';

export async function connectMongoDB(): Promise<mongoose.Connection> {
  await mongoose.connect(config.mongodb.uri, {
    dbName: config.mongodb.dbName,
  });
  console.log(`[MongoDB] Connected to ${config.mongodb.uri}`);
  return mongoose.connection;
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected');
}
