import { NextResponse } from 'next/server';
import { prisma, type TransactionClient } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plateNo = searchParams.get('plateNo');
  const brand = searchParams.get('brand');

  const where: Record<string, unknown> = {};
  if (plateNo) where.plateNo = { contains: plateNo };
  if (brand) where.brand = { contains: brand };

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(vehicles);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { plateNo, brand, model, year, vin, mileage, customerId, customer } = body;

  if (!plateNo || !brand || !model) {
    return NextResponse.json(
      { error: 'plateNo, brand, and model are required' },
      { status: 400 }
    );
  }

  if (!customerId && !(customer && customer.name && customer.phone)) {
    return NextResponse.json(
      { error: 'customerId or customer (with name and phone) is required' },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      let resolvedCustomerId = customerId;

      if (!resolvedCustomerId && customer && customer.name && customer.phone) {
        let existingCustomer = await tx.customer.findFirst({
          where: { phone: customer.phone },
        });

        if (existingCustomer) {
          resolvedCustomerId = existingCustomer.id;
          if (customer.name !== existingCustomer.name) {
            existingCustomer = await tx.customer.update({
              where: { id: existingCustomer.id },
              data: { name: customer.name },
            });
          }
        } else {
          const newCustomer = await tx.customer.create({
            data: {
              name: customer.name,
              phone: customer.phone,
            },
          });
          resolvedCustomerId = newCustomer.id;
        }
      }

      const vehicle = await tx.vehicle.create({
        data: {
          plateNo,
          brand,
          model,
          year,
          vin,
          mileage,
          customerId: resolvedCustomerId,
        },
        include: { customer: true },
      });

      return vehicle;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create vehicle';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
