import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const EXPORT_DIR = "/tmp/waitlist-exports";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "非法文件名" }, { status: 400 });
  }

  const filePath = path.join(EXPORT_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  const isXlsx = filename.endsWith(".xlsx");
  const contentType = isXlsx
    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    : "text/csv";

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
