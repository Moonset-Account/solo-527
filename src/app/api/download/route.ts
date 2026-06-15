import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-log";
import { LogAction } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const task = await prisma.exportTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status !== "COMPLETED") {
      return NextResponse.json({ error: "Export not completed" }, { status: 400 });
    }

    if (!task.fileName) {
      return NextResponse.json({ error: "No file available" }, { status: 400 });
    }

    await createAuditLog({
      action: LogAction.DOWNLOAD,
      entityType: "ExportTask",
      entityId: taskId,
      userId: task.userId,
      description: `下载导出文件: ${task.fileName}`,
    });

    const filePath = join(process.cwd(), "uploads", "exports", task.fileName);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
    }

    const data = await readFile(filePath);

    return new NextResponse(data, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(task.fileName)}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Length": data.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
