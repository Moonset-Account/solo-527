import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/news-collab');
    console.log(`📦 MongoDB 连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};

export default mongoose;
