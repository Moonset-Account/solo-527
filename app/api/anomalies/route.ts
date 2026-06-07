import { NextResponse } from 'next/server';
import { getAnomalyNotes, addAnomalyNote } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const measurementId = searchParams.get('measurementId') || undefined;

    const notes = await getAnomalyNotes(measurementId);
    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('获取异常备注错误:', error);
    return NextResponse.json(
      { error: '获取异常备注失败: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const note = await addAnomalyNote(body);
    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    console.error('添加异常备注错误:', error);
    return NextResponse.json(
      { error: '添加异常备注失败: ' + error.message },
      { status: 500 }
    );
  }
}
