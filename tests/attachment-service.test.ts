import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/db';
import { users, clients, projects, attachments } from '@/db/schema';
import { checkAttachmentAccess } from '@/lib/attachment-service';
import { v4 as uuidv4 } from 'uuid';

vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('sharp', () => ({
  default: () => ({
    resize: () => ({
      toFile: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}));

describe('Attachment Service', () => {
  let adminUserId: string;
  let client1UserId: string;
  let client2UserId: string;
  let client1Id: string;
  let client2Id: string;
  let project1Id: string;
  let project2Id: string;

  beforeEach(async () => {
    adminUserId = uuidv4();
    client1UserId = uuidv4();
    client2UserId = uuidv4();
    client1Id = uuidv4();
    client2Id = uuidv4();
    project1Id = uuidv4();
    project2Id = uuidv4();

    await db.insert(users).values([
      {
        id: adminUserId,
        name: 'Admin',
        email: 'admin@test.com',
        role: 'admin',
      },
      {
        id: client1UserId,
        name: 'Client 1',
        email: 'client1@test.com',
        role: 'client',
      },
      {
        id: client2UserId,
        name: 'Client 2',
        email: 'client2@test.com',
        role: 'client',
      },
    ]);

    await db.insert(clients).values([
      {
        id: client1Id,
        userId: client1UserId,
        companyName: 'Client 1 Company',
      },
      {
        id: client2Id,
        userId: client2UserId,
        companyName: 'Client 2 Company',
      },
    ]);

    await db.insert(projects).values([
      {
        id: project1Id,
        clientId: client1Id,
        name: 'Client 1 Project',
        totalAmount: 10000,
        createdBy: adminUserId,
      },
      {
        id: project2Id,
        clientId: client2Id,
        name: 'Client 2 Project',
        totalAmount: 20000,
        createdBy: adminUserId,
      },
    ]);
  });

  it('管理员可以访问所有附件', async () => {
    const attachmentId = uuidv4();
    await db.insert(attachments).values({
      id: attachmentId,
      projectId: project1Id,
      fileName: 'test.pdf',
      filePath: 'test.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      uploadedBy: adminUserId,
    });

    const canAccess = await checkAttachmentAccess(attachmentId, adminUserId, 'admin');
    expect(canAccess).toBe(true);
  });

  it('客户可以访问自己项目的附件', async () => {
    const attachmentId = uuidv4();
    await db.insert(attachments).values({
      id: attachmentId,
      projectId: project1Id,
      fileName: 'test.pdf',
      filePath: 'test.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      uploadedBy: adminUserId,
    });

    const canAccess = await checkAttachmentAccess(attachmentId, client1UserId, 'client');
    expect(canAccess).toBe(true);
  });

  it('客户不能访问其他客户项目的附件', async () => {
    const attachmentId = uuidv4();
    await db.insert(attachments).values({
      id: attachmentId,
      projectId: project1Id,
      fileName: 'test.pdf',
      filePath: 'test.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      uploadedBy: adminUserId,
    });

    const canAccess = await checkAttachmentAccess(attachmentId, client2UserId, 'client');
    expect(canAccess).toBe(false);
  });

  it('公开附件所有授权用户都可以访问', async () => {
    const attachmentId = uuidv4();
    await db.insert(attachments).values({
      id: attachmentId,
      projectId: project1Id,
      fileName: 'test.pdf',
      filePath: 'test.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      isPublic: true,
      uploadedBy: adminUserId,
    });

    const canAccess = await checkAttachmentAccess(attachmentId, client2UserId, 'client');
    expect(canAccess).toBe(true);
  });

  it('上传附件记录上传人信息', async () => {
    const attachmentId = uuidv4();
    await db.insert(attachments).values({
      id: attachmentId,
      projectId: project1Id,
      fileName: 'design.pdf',
      filePath: 'design.pdf',
      mimeType: 'application/pdf',
      fileSize: 500000,
      uploadedBy: adminUserId,
    });

    const attachment = await db.query.attachments.findFirst({
      where: (a, { eq }) => eq(a.id, attachmentId),
    });

    expect(attachment?.uploadedBy).toBe(adminUserId);
    expect(attachment?.fileName).toBe('design.pdf');
    expect(attachment?.projectId).toBe(project1Id);
  });
});
