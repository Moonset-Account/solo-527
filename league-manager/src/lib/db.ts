import mongoose from 'mongoose';

export default async function dbConnect(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }
  return mongoose.connect(process.env.MONGODB_URI!);
}
