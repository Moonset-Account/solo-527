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
      if (startDate) where[dateField].gte = startDate;
      if (endDate) where[dateField].lte = endDate;
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

    const visit = await prisma.visitProcess.create({
      data: {
        ...cleanedData,
        visitNumberMasked,
        createdBy: user.id,
      },
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
