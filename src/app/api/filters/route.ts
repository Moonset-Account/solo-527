import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { validate, savedFilterSchema } from "@/lib/validation";

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
    const pageName = searchParams.get("pageName");

    const where: Record<string, unknown> = {
      userId: auth.user.userId,
    };
    if (pageName) {
      where.pageName = pageName;
    }

    const filters = await prisma.savedFilter.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const parsedFilters = filters.map((f) => ({
      ...f,
      filterData: JSON.parse(f.filterData),
    }));

    return NextResponse.json({
      success: true,
      data: parsedFilters,
    });
  } catch (error) {
    console.error("Get saved filters error:", error);
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
    const validation = validate(savedFilterSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { pageName, filterName, filterData } = validation.data!;
    const filterDataStr = JSON.stringify(filterData);

    const existing = await prisma.savedFilter.findFirst({
      where: {
        userId: auth.user.userId,
        pageName,
        filterName,
      },
    });

    let filter;
    if (existing) {
      filter = await prisma.savedFilter.update({
        where: { id: existing.id },
        data: { filterData: filterDataStr },
      });
    } else {
      filter = await prisma.savedFilter.create({
        data: {
          userId: auth.user.userId,
          pageName,
          filterName,
          filterData: filterDataStr,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: filter,
        message: existing ? "筛选条件已更新" : "筛选条件已保存",
      },
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    console.error("Save filter error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) {
    return NextResponse.json(
      { success: false, error: auth.error.message },
      { status: auth.error.status }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0", 10);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "请指定筛选条件ID" },
        { status: 400 }
      );
    }

    const filter = await prisma.savedFilter.findUnique({
      where: { id },
    });

    if (!filter) {
      return NextResponse.json(
        { success: false, error: "筛选条件不存在" },
        { status: 404 }
      );
    }

    if (filter.userId !== auth.user.userId) {
      return NextResponse.json(
        { success: false, error: "无权删除该筛选条件" },
        { status: 403 }
      );
    }

    await prisma.savedFilter.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "筛选条件已删除",
    });
  } catch (error) {
    console.error("Delete filter error:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
