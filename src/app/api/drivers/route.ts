import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/lib/types";
import prisma from "@/lib/prisma";
import { authenticateRequest, requireRole } from "@/lib/auth";
import { parsePagination } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) {
    return NextResponse.json(
      { success: false, error: auth.error.message },
      { status: auth.error.status }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);

    const village = searchParams.get("village");
    const machineryId = searchParams.get("machineryId");

    const where: Record<string, unknown> = {};
    if (village) where.village = village;
    if (machineryId) where.machineryId = parseInt(machineryId, 10);

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take,
        include: {
          machinery: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.driver.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: drivers,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get drivers error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) {
    return NextResponse.json(
      { success: false, error: auth.error.message },
      { status: auth.error.status }
    );
  }

  const roleCheck = requireRole(auth.user, [UserRole.INTERNAL]);
  if (!roleCheck.allowed) {
    return NextResponse.json(
      { success: false, error: roleCheck.error },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    const { name, phone, licenseNo, village, machineryId } = body;

    if (!name || !phone || !licenseNo || !village) {
      return NextResponse.json(
        { success: false, error: "请填写必要信息" },
        { status: 400 }
      );
    }

    const existing = await prisma.driver.findUnique({
      where: { licenseNo },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "该驾驶证号已存在" },
        { status: 409 }
      );
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
        licenseNo,
        village,
        machineryId: machineryId ? parseInt(machineryId, 10) : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: driver,
        message: "司机信息创建成功",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create driver error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
