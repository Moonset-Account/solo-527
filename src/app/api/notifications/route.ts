import { NextResponse } from 'next/server';

const mockNotifications = [
  {
    id: 'n1',
    title: '新的付款到账',
    message: '官网设计项目首付款 ¥25,000 已到账',
    type: 'payment',
    status: 'unread',
    createdAt: '2024-02-15T10:30:00.000Z',
  },
  {
    id: 'n2',
    title: '发票即将到期',
    message: 'INV2024020002 将在3天后到期',
    type: 'invoice',
    status: 'unread',
    createdAt: '2024-02-14T09:00:00.000Z',
  },
  {
    id: 'n3',
    title: '报价单已被查看',
    message: '客户查看了 Q2024010002 报价单',
    type: 'quote',
    status: 'read',
    createdAt: '2024-02-13T14:20:00.000Z',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  let data = [...mockNotifications];
  if (unreadOnly) {
    data = data.filter((n) => n.status === 'unread');
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === 'mark-read' && body.id) {
    const notification = mockNotifications.find((n) => n.id === body.id);
    if (notification) {
      notification.status = 'read';
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
