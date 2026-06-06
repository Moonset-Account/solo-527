import { auth } from '@/auth';

export async function withAuthSession() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { session, status: 200 };
}

export async function requireRole(requiredRole: 'admin' | 'client') {
  const result = await withAuthSession();
  if ('error' in result) return result;

  if (result.session.user.role !== requiredRole) {
    return { error: 'Forbidden', status: 403 };
  }

  return result;
}

export async function requireAdmin() {
  return requireRole('admin');
}

export async function requireClient() {
  return requireRole('client');
}

export async function canAccessProject(
  projectId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === 'admin') return true;
  return true;
}

export async function canAccessAttachment(
  attachmentId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === 'admin') return true;
  return true;
}

export async function canAccessQuote(
  quoteId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === 'admin') return true;
  return true;
}

export async function canAccessInvoice(
  invoiceId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === 'admin') return true;
  return true;
}

export function sanitizeProjectForClient<T extends { internalCost?: number | null; privateNotes?: string | null }>(
  project: T
): Omit<T, 'internalCost' | 'privateNotes'> {
  const { internalCost, privateNotes, ...sanitized } = project;
  return sanitized;
}

export function sanitizeProjectsForClient<T extends { internalCost?: number | null; privateNotes?: string | null }>(
  projects: T[]
) {
  return projects.map(sanitizeProjectForClient);
}
