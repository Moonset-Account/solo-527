import { NextRequest, NextResponse } from "next/server";
import { UserRole, MachineryType } from "@/lib/types";
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

    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [machineries, total] = await Promise.all([
      prisma.machinery.findMany({
        where,
        skip,
        take,
        include: {
          drivers: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.machinery.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: machineries,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get machinery error:", error);
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

    const {
      name,
      type,
      plateNumber,
      brand,
      model,
      year,
      fuelCapacity,
      efficiency,
      purchaseDate,
    } = body;

    if (!name || !type || !plateNumber) {
      return NextResponse.json(
        { success: false, error: "请填写必要信息" },
        { status: 400 }
      );
    }

    const existing = await prisma.machinery.findUnique({
      where: { plateNumber },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "该车牌号已存在" },
        { status: 409 }
      );
    }

    const machinery = await prisma.machinery.create({
      data: {
        name,
        type: type as MachineryType,
        plateNumber,
        brand,
        model,
        year: parseInt(year, 10),
        fuelCapacity: parseFloat(fuelCapacity),
        efficiency: parseFloat(efficiency),
        purchaseDate: new Date(purchaseDate),
        currentFuel: 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: machinery,
        message: "农机档案创建成功",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create machinery error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
