import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-log";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

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

    await createAuditLog({
      action: "DOWNLOAD",
      entityType: "ExportTask",
      entityId: taskId,
      userId: task.userId,
      description: `下载导出文件: ${task.fileName}`,
    });

    const fileName = task.fileName || `export_${taskId}.xlsx`;
    const mockContent = Buffer.from("Mock export content");
    const tempPath = join(tmpdir(), fileName);
    await writeFile(tempPath, mockContent);

    const file = await import("fs").then(fs => fs.promises.readFile(tempPath));

    return new NextResponse(file, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
