export async function uploadAttachment(
  projectId: string,
  file: File,
  uploadedBy: string,
  isPublic = false
) {
  console.log('[Attachment] Upload:', { projectId, fileName: file.name, uploadedBy, isPublic });
  return {
    id: Date.now(),
    projectId,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    isPublic,
    uploadedBy,
  };
}

export async function getAttachmentsByProject(projectId: string) {
  return [];
}

export async function getAttachmentById(attachmentId: string) {
  return null;
}

export async function deleteAttachment(attachmentId: string) {
  console.log('[Attachment] Delete:', attachmentId);
}

export async function checkAttachmentAccess(
  attachmentId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  return true;
}

export function getAttachmentFilePath(filePath: string) {
  return filePath;
}
