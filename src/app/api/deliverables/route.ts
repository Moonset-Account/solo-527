import { NextResponse } from 'next/server';

const mockDeliverables = [
  { id: 'd1', projectName: '官网设计项目', fileName: '首页设计稿.psd', fileSize: 15728640, uploadedAt: '2024-01-25', downloadUrl: '/download/d1' },
  { id: 'd2', projectName: '官网设计项目', fileName: '内页设计稿.psd', fileSize: 20971520, uploadedAt: '2024-02-01', downloadUrl: '/download/d2' },
  { id: 'd3', projectName: 'APP UI 设计', fileName: '设计规范.pdf', fileSize: 5242880, uploadedAt: '2024-02-05', downloadUrl: '/download/d3' },
];

export async function GET() {
  return NextResponse.json({ data: mockDeliverables, count: mockDeliverables.length });
}
