import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, hasPermission, hasDepartmentAccess, createAuthErrorResponse, createPermissionErrorResponse } from "@/lib/auth";
import { validateVisitData, cleanAndCalculateWaitTimes, maskVisitNumber } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return createAuthErrorResponse();
    if (!hasPermission(user, "dashboard:view")) return createPermissionErrorResponse();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "100");
    const skip = (page - 1) * pageSize;

    const deptId = searchParams.get("deptId");
    const doctorId = searchParams.get("doctorId");
    const patientTypeId = searchParams.get("patientTypeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const dateField = searchParams.get("dateField") || "visitDate";

    const where: any = {};

    if (user.departmentScopes.length > 0) {
      where.deptId = { in: user.departmentScopes };
    }

    if (deptId) where.deptId = deptId;
    if (doctorId) where.doctorId = doctorId;
    if (patientTypeId) where.patientTypeId = patientTypeId;
    if (startDate || endDate) {
      where[dateField] = {};
      if (startDate) where[dateField].gte = new Date(startDate);
      if (endDate) where[dateField].lte = new Date(endDate);
    }

    const [visits, total] = await Promise.all([
      prisma.visitProcess.findMany({
        where,
        include: {
          department: true,
          doctor: true,
          patientType: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.visitProcess.count({ where }),
    ]);

    return NextResponse.json({
      data: visits,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return createAuthErrorResponse();
    if (!hasPermission(user, "data:import")) return createPermissionErrorResponse();

    const body = await request.json();
    const validation = validateVisitData(body);

    if (!validation.valid) {
      return NextResponse.json(
        { error: "数据验证失败", errors: validation.errors },
        { status: 400 }
      );
    }

    if (!hasDepartmentAccess(user, body.deptId)) {
      return createPermissionErrorResponse("无权操作该科室数据");
    }

    const cleanedData = cleanAndCalculateWaitTimes(body);
    const visitNumberMasked = maskVisitNumber(body.visitNumber || "");

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
    };

    const visit = await prisma.visitProcess.create({
      data: createData,
      include: {
        department: true,
        doctor: true,
        patientType: true,
      },
    });

    return NextResponse.json({ data: visit, warnings: validation.warnings }, { status: 201 });
  } catch (error) {
    console.error("Error creating visit:", error);
    return NextResponse.json({ error: "创建数据失败" }, { status: 500 });
  }
}
