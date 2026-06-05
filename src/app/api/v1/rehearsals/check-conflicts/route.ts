import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { productionId, venueId, startTime, endTime, excludeRehearsalId } = await request.json();

    const conflicts = [];

    const venueConflict = await prisma.rehearsal.findFirst({
      where: {
        venueId,
        id: excludeRehearsalId ? { not: excludeRehearsalId } : undefined,
        AND: [
          { startTime: { lt: new Date(endTime) } },
          { endTime: { gt: new Date(startTime) } },
        ],
      },
      include: {
        production: { select: { title: true } },
        venue: { select: { name: true } },
      },
    });

    if (venueConflict) {
      conflicts.push({
        type: 'VENUE',
        message: `场地冲突：${venueConflict.venue.name} 在该时间段已被 ${venueConflict.production.title} 使用`,
        rehearsal: venueConflict,
      });
    }

    const characters = await prisma.character.findMany({
      where: { productionId, actorId: { not: null } },
      include: { actor: true },
    });

    for (const char of characters) {
      if (!char.actorId) continue;

      const actorRehearsalConflict = await prisma.rehearsal.findFirst({
        where: {
          id: excludeRehearsalId ? { not: excludeRehearsalId } : undefined,
          production: {
            characters: {
              some: { actorId: char.actorId },
            },
          },
          AND: [
            { startTime: { lt: new Date(endTime) } },
            { endTime: { gt: new Date(startTime) } },
          ],
        },
        include: {
          production: { select: { title: true } },
        },
      });

      if (actorRehearsalConflict) {
        conflicts.push({
          type: 'ACTOR_REHEARSAL',
          actor: { id: char.actorId, name: char.actor?.name },
          message: `演员 ${char.actor?.name} 在该时间段已有排练：${actorRehearsalConflict.production.title}`,
        });
      }

      const dayOfWeek = new Date(startTime).getDay();
      const startTimeStr = new Date(startTime).toTimeString().slice(0, 5);
      const endTimeStr = new Date(endTime).toTimeString().slice(0, 5);

      const courseConflict = await prisma.courseSchedule.findFirst({
        where: {
          userId: char.actorId,
          dayOfWeek,
          AND: [
            { startTime: { lt: endTimeStr } },
            { endTime: { gt: startTimeStr } },
          ],
        },
      });

      if (courseConflict) {
        conflicts.push({
          type: 'COURSE',
          actor: { id: char.actorId, name: char.actor?.name },
          message: `演员 ${char.actor?.name} 在该时间段有课程：${courseConflict.courseName}`,
        });
      }
    }

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflicts,
    });
  } catch (error) {
    console.error('Check conflicts error:', error);
    return NextResponse.json(
      { error: '冲突检测失败' },
      { status: 500 }
    );
  }
}
