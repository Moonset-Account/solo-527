import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/pagination";
import { createVersionHistory, takeSnapshot } from "@/lib/version-history";
import { z } from "zod";
import type { Prisma, ContractStatus } from "@prisma/client";

const updateContractSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().min(0).optional(),
  note: z.string().optional(),
  updatedById: z.string().uuid(),
});

const signContractSchema = z.object({
  signedById: z.string().uuid(),
  note: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } },
        signedBy: { select: { id: true, name: true } },
        versionHistory: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { version: "desc" },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...contract,
      amount: contract.amount.toNumber(),
    });
  } catch (error) {
    console.error("Get contract error:", error);
    return NextResponse.json({ error: "Failed to fetch contract" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "sign") {
    try {
      const body = await request.json();
      const validated = signContractSchema.parse(body);

      const existingContract = await prisma.contract.findUnique({
        where: { id: params.id },
      });

      if (!existingContract) {
        return NextResponse.json({ error: "Contract not found" }, { status: 404 });
      }

      const contract = await prisma.$transaction(async (tx) => {
        const snapshot = takeSnapshot(existingContract);
        const newVersion = existingContract.version + 1;

        const updatedContract = await tx.contract.update({
          where: { id: params.id },
          data: {
            status: "SIGNED" as ContractStatus,
            version: newVersion,
            signedAt: new Date(),
            signedById: validated.signedById,
            note: validated.note,
          },
          include: {
            project: { select: { id: true, name: true } },
          },
        });

        await createVersionHistory(
          "Contract",
          params.id,
          newVersion,
          snapshot,
          validated.signedById,
          validated.note || "Contract signed",
          tx
        );

        return updatedContract;
      });

      await invalidateCachePattern("contracts:*");
      await invalidateCachePattern(`projects:${contract.projectId}*`);

      return NextResponse.json(contract);
    } catch (error) {
      console.error("Sign contract error:", error);
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to sign contract" }, { status: 500 });
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
    const validated = updateContractSchema.parse(body);

    const existingContract = await prisma.contract.findUnique({
      where: { id: params.id },
    });

    if (!existingContract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const contract = await prisma.$transaction(async (tx) => {
      const snapshot = takeSnapshot(existingContract);
      const newVersion = existingContract.version + 1;

      const updatedContract = await tx.contract.update({
        where: { id: params.id },
        data: {
          name: validated.name,
          type: validated.type,
          description: validated.description,
          amount: validated.amount,
          note: validated.note,
          version: newVersion,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      await createVersionHistory(
        "Contract",
        params.id,
        newVersion,
        snapshot,
        validated.updatedById,
        validated.note || "Contract updated",
        tx
      );

      return updatedContract;
    });

    await invalidateCachePattern("contracts:*");
    await invalidateCachePattern(`projects:${contract.projectId}*`);

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Update contract error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update contract" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.versionHistory.deleteMany({
        where: {
          entityType: "Contract",
          entityId: params.id,
        },
      });

      await tx.contract.delete({
        where: { id: params.id },
      });
    });

    await invalidateCachePattern("contracts:*");
    await invalidateCachePattern(`projects:${contract.projectId}*`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete contract error:", error);
    return NextResponse.json({ error: "Failed to delete contract" }, { status: 500 });
  }
}
