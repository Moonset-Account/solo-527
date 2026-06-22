import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parsePaginationParams,
  createPrismaPagination,
  createPaginatedResult,
  invalidateCachePattern,
} from "@/lib/pagination";
import {
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  checkOverdueRepairs,
} from "@/lib/notifications";
import { z } from "zod";

const markReadSchema = z.object({
  notificationId: z.string().uuid(),
  userId: z.string().uuid(),
});

const markAllReadSchema = z.object({
  userId: z.string().uuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const pagination = parsePaginationParams(searchParams);

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const { skip, take } = createPrismaPagination(pagination);

    const where = {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          repair: {
            select: {
              id: true,
              title: true,
              status: true,
              deadline: true,
              project: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
      getUnreadNotificationCount(userId),
    ]);

    const result = createPaginatedResult(notifications, total, pagination);

    return NextResponse.json({
      ...result,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validated = markReadSchema.parse(body);

    await markNotificationRead(validated.notificationId, validated.userId);
    await invalidateCachePattern("notifications:*");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to mark notification read" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "markAllRead") {
    try {
      const body = await request.json();
      const validated = markAllReadSchema.parse(body);

      await markAllNotificationsRead(validated.userId);
      await invalidateCachePattern("notifications:*");

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Failed to mark all notifications read" },
        { status: 500 }
      );
    }
  }

  if (action === "checkOverdue") {
    try {
      const result = await checkOverdueRepairs();
      return NextResponse.json(result);
    } catch (error) {
      console.error("Check overdue repairs error:", error);
      return NextResponse.json({ error: "Failed to check overdue repairs" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
