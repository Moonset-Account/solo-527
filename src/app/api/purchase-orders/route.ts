import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  PurchaseService,
  createPurchaseOrderSchema,
} from "@/lib/services/purchaseService";
import { Role } from "@/generated/prisma";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = createPurchaseOrderSchema.parse(body);

    const userRole = session.user.role as Role;
    const purchaseOrder = await PurchaseService.createPurchaseOrder(
      session.user.id,
      userRole,
      input
    );

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
