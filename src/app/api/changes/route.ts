import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ChangeService, createChangeSchema } from "@/lib/services/changeService";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerId = session.user.role === "OWNER" ? session.user.id : undefined;
    const changes = await ChangeService.getPendingChangesForWeek(ownerId);

    return NextResponse.json(changes);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = createChangeSchema.parse(body);

    const change = await ChangeService.createChange(session.user.id, input);

    return NextResponse.json(change, { status: 201 });
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
