import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ChangeService, updateChangeSchema } from "@/lib/services/changeService";
import { z } from "zod";
import { Role } from "@/generated/prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const change = await ChangeService.getChangeById(id);

    if (!change) {
      return NextResponse.json({ error: "Change request not found" }, { status: 404 });
    }

    return NextResponse.json(change);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const input = updateChangeSchema.parse(body);

    const userRole = session.user.role as Role;
    const change = await ChangeService.updateChange(
      id,
      session.user.id,
      input,
      userRole
    );

    return NextResponse.json(change);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
