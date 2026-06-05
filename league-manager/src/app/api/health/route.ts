import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    if (mongoose.connection.readyState === 1) {
      return NextResponse.json({ status: 'ok', timestamp, mongodb: 'connected' });
    }
    if (mongoose.connection.readyState === 2) {
      return NextResponse.json({ status: 'ok', timestamp, mongodb: 'connecting' });
    }
    await mongoose.connect(process.env.MONGODB_URI!);
    return NextResponse.json({ status: 'ok', timestamp, mongodb: 'connected' });
  } catch {
    return NextResponse.json(
      { status: 'error', timestamp, mongodb: 'disconnected' },
      { status: 503 }
    );
  }
}
