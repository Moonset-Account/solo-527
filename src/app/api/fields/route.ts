import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
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
    const cropType = searchParams.get("cropType");

    const where: Record<string, unknown> = {};
    if (village) where.village = village;
    if (cropType) where.cropType = cropType;

    const [fields, total] = await Promise.all([
      prisma.field.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.field.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: fields,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Get fields error:", error);
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

  try {
    const body = await req.json();

    const { village, location, area, cropType, ownerName, ownerPhone, description } =
      body;

    if (!village || !location || !area || !cropType || !ownerName || !ownerPhone) {
      return NextResponse.json(
        { success: false, error: "请填写必要信息" },
        { status: 400 }
      );
    }

    const field = await prisma.field.create({
      data: {
        village,
        location,
        area: parseFloat(area),
        cropType,
        ownerName,
        ownerPhone,
        description,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: field,
        message: "作业地块创建成功",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create field error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
