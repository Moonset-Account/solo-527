import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const attachmentId = params.id;

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const uploadsDir = path.join(process.cwd(), "uploads");
    const filename = attachment.url.replace("/uploads/", "");
    const filepath = path.join(uploadsDir, filename);

    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(filepath);
    } catch {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
    }

    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.name)}"`,
        "Content-Length": String(attachment.size),
      },
    });

    return response;
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
