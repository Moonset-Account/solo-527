import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

interface UserContext {
  id: string;
  role: UserRole;
  departmentId?: string;
}

export function canViewAllVisitors(user: UserContext): boolean {
  return user.role === 'ADMIN' || user.role === 'RECEPTIONIST';
}

export function canViewDepartmentVisitors(user: UserContext, departmentId: string): boolean {
  if (canViewAllVisitors(user)) return true;
  return user.role === 'EMPLOYEE' && user.departmentId === departmentId;
}

export function canViewVisitor(user: UserContext, visitorDepartmentId: string, hostId: string): boolean {
  if (canViewAllVisitors(user)) return true;
  if (user.role === 'EMPLOYEE') {
    return user.departmentId === visitorDepartmentId && user.id === hostId;
  }
  return false;
}

export function canManageMeetings(user: UserContext): boolean {
  return user.role === 'ADMIN' || user.role === 'EMPLOYEE';
}

export function canManageFrontDesk(user: UserContext): boolean {
  return user.role === 'ADMIN' || user.role === 'RECEPTIONIST';
}

export function canCancelMeeting(user: UserContext, meetingHostId: string, meetingDepartmentId: string): boolean {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'RECEPTIONIST') return true;
  if (user.role === 'EMPLOYEE') {
    return user.id === meetingHostId;
  }
  return false;
}

export async function validateVisitorAccess(
  user: UserContext,
  visitorId: string
): Promise<boolean> {
  if (canViewAllVisitors(user)) return true;

  const visitor = await prisma.visitor.findUnique({
    where: { id: visitorId },
    include: {
      meeting: {
        select: {
          departmentId: true,
          hostId: true,
        },
      },
    },
  });

  if (!visitor) return false;

  return canViewVisitor(user, visitor.meeting.departmentId, visitor.meeting.hostId);
}

export async function filterVisitorsByPermission(
  user: UserContext,
  visitorIds: string[]
): Promise<string[]> {
  if (canViewAllVisitors(user)) return visitorIds;

  const visitors = await prisma.visitor.findMany({
    where: {
      id: { in: visitorIds },
    },
    select: {
      id: true,
      meeting: {
        select: {
          departmentId: true,
          hostId: true,
        },
      },
    },
  });

  return visitors
    .filter(v => canViewVisitor(user, v.meeting.departmentId, v.meeting.hostId))
    .map(v => v.id);
}
