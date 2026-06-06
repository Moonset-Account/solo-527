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

    if (!file) {
      return NextResponse.json({ error: "请上传CSV文件" }, { status: 400 });
    }

    const content = await file.text();
    const csvResult = parseCSV(content);

    if (csvResult.rowCount === 0) {
      return NextResponse.json({ error: "CSV文件为空" }, { status: 400 });
    }

    const importLog = await prisma.importLog.create({
      data: {
        fileName: file.name,
        totalRecords: csvResult.rowCount,
        userId: user.id,
        status: "processing",
      },
    });

    const allErrors: any[] = [];
    const allWarnings: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < csvResult.data.length; i++) {
      const rowNum = i + 2;
      const rawRow = csvResult.data[i];
      const mappedRow = mapCSVRow(rawRow);
      const validation = validateVisitData(mappedRow, rowNum);

      if (!validation.valid) {
        allErrors.push(...validation.errors);
        failedCount++;
        continue;
      }

      if (validation.warnings.length > 0) {
        allWarnings.push(...validation.warnings);
      }

      try {
        const cleanedData = cleanAndCalculateWaitTimes(mappedRow);
        const visitNumberMasked = maskVisitNumber(mappedRow.visitNumber || "");

        let visitDate: Date;
        if (cleanedData.visitDate) {
          visitDate = new Date(cleanedData.visitDate);
        } else if (cleanedData.registerTime) {
          visitDate = new Date(cleanedData.registerTime);
        } else {
          visitDate = new Date();
        }

        const createData: any = {
          visitNumberMasked,
          deptId: cleanedData.deptId,
          patientTypeId: cleanedData.patientTypeId || null,
          doctorId: cleanedData.doctorId || null,
          registerTime: cleanedData.registerTime ? new Date(cleanedData.registerTime) : null,
          checkinTime: cleanedData.checkinTime ? new Date(cleanedData.checkinTime) : null,
          triageTime: cleanedData.triageTime ? new Date(cleanedData.triageTime) : null,
          callTime: cleanedData.callTime ? new Date(cleanedData.callTime) : null,
          paymentTime: cleanedData.paymentTime ? new Date(cleanedData.paymentTime) : null,
          medicineTime: cleanedData.medicineTime ? new Date(cleanedData.medicineTime) : null,
          waitTotalMinutes: cleanedData.waitTotalMinutes,
          waitRegisterMinutes: cleanedData.waitRegisterMinutes,
          waitTriageMinutes: cleanedData.waitTriageMinutes,
          waitDoctorMinutes: cleanedData.waitDoctorMinutes,
          waitPaymentMinutes: cleanedData.waitPaymentMinutes,
          waitMedicineMinutes: cleanedData.waitMedicineMinutes,
          visitDate,
          hourOfDay: cleanedData.hourOfDay,
          dayOfWeek: cleanedData.dayOfWeek,
          importId: importLog.id,
        };

        await prisma.visitProcess.create({ data: createData });
        successCount++;
      } catch (err) {
        allErrors.push({
          row: rowNum,
          field: "database",
          message: `数据库写入失败: ${(err as Error).message}`,
          value: "",
        });
        failedCount++;
      }
    }

    await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        successRecords: successCount,
        failedRecords: failedCount,
        errorDetails: {
          errors: allErrors,
          warnings: allWarnings,
        },
        status: failedCount === 0 ? "completed" : successCount > 0 ? "partial" : "failed",
      },
    });

    return NextResponse.json({
      success: true,
      importId: importLog.id,
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

    const where: any = {};
    if (user.departmentScopes.length > 0) {
      where.userId = user.id;
    }

    const logs = await prisma.importLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error("Error fetching import logs:", error);
    return NextResponse.json({ error: "获取导入记录失败" }, { status: 500 });
  }
}
