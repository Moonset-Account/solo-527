import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ChangeService } from "@/lib/services/changeService";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["submit", "confirm", "reject", "withdraw"]),
  comment: z.string().optional(),
});

export async function POST(
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
    const { action, comment } = actionSchema.parse(body);

    let result;

    switch (action) {
      case "submit":
        result = await ChangeService.submitForConfirmation(id, session.user.id);
        break;
      case "confirm":
        result = await ChangeService.confirmChange(id, session.user.id, comment);
        break;
      case "reject":
        result = await ChangeService.rejectChange(id, session.user.id, comment);
        break;
      case "withdraw":
        result = await ChangeService.withdrawChange(id, session.user.id, comment);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
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
