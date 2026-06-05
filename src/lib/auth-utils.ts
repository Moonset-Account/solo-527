import { auth } from '@/auth';
import { db } from '@/db';
import { projects, attachments, quotes, invoices, clients } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { clientId: true },
  });

  if (!project) return false;

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, project.clientId!),
    columns: { userId: true },
  });

  return client?.userId === userId;
}

export async function canAccessAttachment(
  attachmentId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, attachmentId),
  });

  if (!attachment) return false;
  if (attachment.isPublic) return true;

  return canAccessProject(attachment.projectId, userId, userRole);
}

export async function canAccessQuote(
  quoteId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
    columns: { projectId: true },
  });

  if (!quote) return false;

  return canAccessProject(quote.projectId, userId, userRole);
}

export async function canAccessInvoice(
  invoiceId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    columns: { projectId: true },
  });

  if (!invoice) return false;

  return canAccessProject(invoice.projectId, userId, userRole);
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
