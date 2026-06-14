import { Module, Global, OnModuleInit } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Global()
@Module({
  providers: [
    {
      provide: getConnectionToken(),
      useValue: mongoose.connection,
    },
  ],
  exports: [getConnectionToken()],
})
export class DatabaseModule implements OnModuleInit {
  async onModuleInit() {
    const uri = process.env.MONGODB_URI || '';
    let finalUri = uri;
    let timeout = 10000;

    if (!uri) {
      try {
        console.log('[DB] MONGODB_URI not set, starting in-memory MongoDB...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create({
          instance: { dbName: 'brand_video_review' },
          binary: { version: '6.0.13', downloadDir: '/tmp/mongodb-cache', checkMD5: false },

        });
        finalUri = mongod.getUri();
        timeout = 180000;
        console.log('[DB] In-memory MongoDB ready:', finalUri);
      } catch (err: any) {
        console.warn('[DB] In-memory MongoDB failed:', err.message);
        console.warn('[DB] -> DB operations will return mocked empty responses.');
        (mongoose as any)._dbUnavailable = true;
        return;
      }
    }

    try {
      console.log('[DB] Connecting to:', uri ? uri : '(in-memory)');
      await mongoose.connect(finalUri, {
        serverSelectionTimeoutMS: timeout,
        connectTimeoutMS: timeout,
        socketTimeoutMS: 30000,
        maxPoolSize: 10,
        autoIndex: true,
      });
      console.log('[DB] Connected successfully ✓');
    } catch (err: any) {
      console.warn('[DB] Connection failed:', err.message);
      console.warn('[DB] -> DB operations will return mocked empty responses.');
      (mongoose as any)._dbUnavailable = true;
    }
  }
}
