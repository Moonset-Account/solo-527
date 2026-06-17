import { NextResponse } from 'next/server';
import { createCashierOrder, getCashierOrderHistory } from '@/lib/cashier';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const history = await getCashierOrderHistory(id);

  return NextResponse.json(history);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { totalAmount, discount, paymentMethod } = body;

  if (totalAmount === undefined || totalAmount === null) {
    return NextResponse.json({ error: 'totalAmount is required' }, { status: 400 });
  }

  try {
    const cashierOrder = await createCashierOrder(
      id,
      totalAmount,
      discount ?? 0,
      paymentMethod
    );

    return NextResponse.json(cashierOrder, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create cashier order';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
