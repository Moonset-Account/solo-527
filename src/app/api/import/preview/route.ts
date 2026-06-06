import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission, createAuthErrorResponse, createPermissionErrorResponse } from "@/lib/auth";
import { parseCSV, mapCSVRow, CSV_COLUMN_MAPPING } from "@/lib/csv";
import { validateVisitData } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return createAuthErrorResponse();
    if (!hasPermission(user, "data:import")) return createPermissionErrorResponse();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请上传CSV文件" }, { status: 400 });
    }

    const content = await file.text();
    const csvResult = parseCSV(content);

    if (csvResult.rowCount === 0) {
      return NextResponse.json({ error: "CSV文件为空" }, { status: 400 });
    }

    const previewRows = csvResult.data.slice(0, 10);
    const mappedPreview = previewRows.map((row) => mapCSVRow(row));

    const allErrors: any[] = [];
    const allWarnings: any[] = [];

    for (let i = 0; i < Math.min(csvResult.data.length, 20); i++) {
      const row = csvResult.data[i];
      const mapped = mapCSVRow(row);
      const validation = validateVisitData(mapped, i + 2);
      
      if (!validation.valid) {
        allErrors.push(...validation.errors);
      }
      if (validation.warnings.length > 0) {
        allWarnings.push(...validation.warnings);
      }
    }

    const detectedColumns = Object.keys(CSV_COLUMN_MAPPING).filter(
      (col) => csvResult.headers.some((h) => h.includes(col) || col.includes(h))
    );

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      totalRows: csvResult.rowCount,
      headers: csvResult.headers,
      columnMapping: CSV_COLUMN_MAPPING,
      detectedColumns,
      preview: mappedPreview,
      sampleErrors: allErrors.slice(0, 20),
      sampleWarnings: allWarnings.slice(0, 10),
      errorCount: allErrors.length,
      warningCount: allWarnings.length,
    });
  } catch (error) {
    console.error("Error previewing CSV:", error);
    return NextResponse.json(
      { error: "预览失败", message: (error as Error).message },
      { status: 500 }
    );
  }
}
