import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmQuote } from "@/lib/budget";
import { invalidateCachePattern } from "@/lib/pagination";
import { createVersionHistory, takeSnapshot } from "@/lib/version-history";
import { z } from "zod";
import type { QuoteStatus } from "@prisma/client";

const confirmQuoteSchema = z.object({
  confirmedById: z.string().uuid(),
  note: z.string().optional(),
});

const updateQuoteStatusSchema = z.object({
  status: z.enum(["DRAFT", "PENDING_CONFIRMATION", "CONFIRMED", "REJECTED"]),
  note: z.string().optional(),
  updatedById: z.string().uuid(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true, address: true } },
        items: true,
        confirmedBy: { select: { id: true, name: true } },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...quote,
      totalAmount: quote.totalAmount.toNumber(),
      items: quote.items.map((item) => ({
        ...item,
        quantity: item.quantity.toNumber(),
        unitPrice: item.unitPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
      })),
    });
  } catch (error) {
    console.error("Get quote error:", error);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "confirm") {
    try {
      const body = await request.json();
      const validated = confirmQuoteSchema.parse(body);

      const quote = await confirmQuote(params.id, validated.confirmedById, validated.note);

      await invalidateCachePattern("quotes:*");
      await invalidateCachePattern(`projects:${quote.projectId}*`);
      await invalidateCachePattern("budget-changes:*");

      return NextResponse.json(quote);
    } catch (error) {
      console.error("Confirm quote error:", error);
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
      }
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to confirm quote" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateQuoteStatusSchema.parse(body);

    const existingQuote = await prisma.quote.findUnique({
      where: { id: params.id },
    });

    if (!existingQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const snapshot = takeSnapshot(existingQuote);
    const newVersion = existingQuote.version + 1;

    const quote = await prisma.$transaction(async (tx) => {
      const updatedQuote = await tx.quote.update({
        where: { id: params.id },
        data: {
          status: validated.status as QuoteStatus,
          version: newVersion,
          note: validated.note,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      await tx.versionHistory.create({
        data: {
          entityType: "Quote",
          entityId: params.id,
          version: newVersion,
          snapshot: snapshot as any,
          changedById: validated.updatedById,
          changeNote: validated.note || `Status changed to ${validated.status}`,
        },
      });

      return updatedQuote;
    });

    await invalidateCachePattern("quotes:*");
    await invalidateCachePattern(`projects:${quote.projectId}*`);

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Update quote error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}
