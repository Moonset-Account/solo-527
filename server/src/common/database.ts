import mongoose, { Connection, Model, Schema } from 'mongoose';

const DB_URI = process.env.MONGODB_URI || '';

let connection: Connection | null = null;
let connectionPromise: Promise<Connection> | null = null;

const registeredModels: Array<{ name: string; schema: Schema }> = [];

export function registerModel(name: string, schema: Schema) {
  registeredModels.push({ name, schema });
  if (connection) {
    connection.model(name, schema);
  }
}

function ensureModels(conn: Connection) {
  for (const { name, schema } of registeredModels) {
    if (!conn.models[name]) {
      conn.model(name, schema);
    }
  }
  return conn;
}

export function getConnection(): Connection {
  if (!connection) {
    throw new Error('Database not initialized yet');
  }
  return connection;
}

export function getModel<T>(name: string): Model<T> {
  const conn = getConnection();
  return conn.model(name) as Model<T>;
}

export function initDatabase(): Promise<Connection> {
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async (): Promise<Connection> => {
    let uri = DB_URI;
    let inMemory = false;

    if (!uri) {
      try {
        console.log('[DB] MONGODB_URI not set, attempting to start in-memory MongoDB...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create({
          instance: { dbName: 'brand_video_review' },
          binary: { version: '6.0.13', downloadDir: '/tmp/mongodb-cache', checkMD5: false },
          spawn: { killOnExit: true } as any,
        });
        uri = mongod.getUri();
        inMemory = true;
        console.log('[DB] In-memory MongoDB started:', uri);
      } catch (err: any) {
        console.warn('[DB] Failed to start in-memory MongoDB:', err.message);
        console.warn('[DB] Service will run WITHOUT database - DB routes will return mock/empty responses.');
        connection = mongoose.createConnection();
        (connection as any)._disconnected = true;
        return ensureModels(connection);
      }
    }

    try {
      console.log('[DB] Connecting to:', inMemory ? '(in-memory)' : uri);
      const conn = await mongoose.createConnection(uri, {
        serverSelectionTimeoutMS: inMemory ? 180000 : 10000,
        connectTimeoutMS: inMemory ? 180000 : 10000,
        socketTimeoutMS: 30000,
        maxPoolSize: 10,
        autoIndex: true,
      }).asPromise();
      console.log('[DB] Connected successfully ✓');
      connection = conn;
      return ensureModels(conn);
    } catch (err: any) {
      console.warn('[DB] Connection failed:', err.message);
      console.warn('[DB] Service will run WITHOUT database - DB routes will return mock/empty responses.');
      connection = mongoose.createConnection();
      (connection as any)._disconnected = true;
      return ensureModels(connection);
    }
  })();

  return connectionPromise;
}
