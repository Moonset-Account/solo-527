import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, hasPermission, createAuthErrorResponse, createPermissionErrorResponse } from "@/lib/auth";
import { parseCSV, mapCSVRow } from "@/lib/csv";
import { validateVisitData, cleanAndCalculateWaitTimes, maskVisitNumber } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return createAuthErrorResponse();
    if (!hasPermission(user, "data:import")) return createPermissionErrorResponse();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const departmentMap: Record<string, string> = JSON.parse(
      formData.get("departmentMap") as string || "{}"
    );
    const doctorMap: Record<string, string> = JSON.parse(
      formData.get("doctorMap") as string || "{}"
    );
    const patientTypeMap: Record<string, string> = JSON.parse(
      formData.get("patientTypeMap") as string || "{}"
    );

    if (!file) {
      return NextResponse.json({ error: "请上传CSV文件" }, { status: 400 });
    }

    const content = await file.text();
    const csvResult = parseCSV(content);

    if (csvResult.rowCount === 0) {
      return NextResponse.json({ error: "CSV文件为空" }, { status: 400 });
    }

    const allErrors: any[] = [];
    const allWarnings: any[] = [];
    const validRows: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < csvResult.data.length; i++) {
      const rowNum = i + 2;
      const rawRow = csvResult.data[i];
      const mappedRow = mapCSVRow(rawRow);

      if (mappedRow.deptId && departmentMap[mappedRow.deptId]) {
        mappedRow.deptId = departmentMap[mappedRow.deptId];
      }
      if (mappedRow.doctorId && doctorMap[mappedRow.doctorId]) {
        mappedRow.doctorId = doctorMap[mappedRow.doctorId];
      }
      if (mappedRow.patientTypeId && patientTypeMap[mappedRow.patientTypeId]) {
        mappedRow.patientTypeId = patientTypeMap[mappedRow.patientTypeId];
      }

      const validation = validateVisitData(mappedRow, rowNum);

      if (!validation.valid) {
        allErrors.push(...validation.errors);
        failedCount++;
        continue;
      }

      if (validation.warnings.length > 0) {
        allWarnings.push(...validation.warnings);
      }

      validRows.push({ ...mappedRow, rowNum });
    }

    for (const row of validRows) {
      try {
        const cleanedData = cleanAndCalculateWaitTimes(row);
        const visitNumberMasked = maskVisitNumber(row.visitNumber || "");

        await prisma.visitProcess.create({
          data: {
            ...cleanedData,
            visitNumberMasked,
            createdBy: user.id,
          },
        });
        successCount++;
      } catch (err) {
        allErrors.push({
          row: row.rowNum,
          field: "database",
          message: `数据库写入失败: ${(err as Error).message}`,
          value: "",
        });
        failedCount++;
      }
    }

    await prisma.importLog.create({
      data: {
        fileName: file.name,
        totalRows: csvResult.rowCount,
        successCount,
        failedCount,
        status: failedCount === 0 ? "completed" : successCount > 0 ? "partial" : "failed",
        errors: allErrors,
        warnings: allWarnings,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: csvResult.rowCount,
        success: successCount,
        failed: failedCount,
      },
      errors: allErrors,
      warnings: allWarnings,
    });
  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json(
      { error: "导入失败", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return createAuthErrorResponse();
    if (!hasPermission(user, "data:import")) return createPermissionErrorResponse();

    const logs = await prisma.importLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error("Error fetching import logs:", error);
    return NextResponse.json({ error: "获取导入记录失败" }, { status: 500 });
  }
}
