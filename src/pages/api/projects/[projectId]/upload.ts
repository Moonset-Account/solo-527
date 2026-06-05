import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler, ApiResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { uploadBase64Image, uploadFile } from '@/lib/storage';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default createApiHandler(
  async (req, res, { userId, role }) => {
    const { projectId } = req.query;

    if (req.method === 'POST') {
      const { fileBase64, fileName, fileType, category, taskId } = req.body;

      if (!fileBase64 || !fileName) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: '文件数据不能为空',
        });
      }

      let uploadResult;
      try {
        if (fileBase64.startsWith('data:image/')) {
          uploadResult = await uploadBase64Image(fileBase64, fileName, `projects/${projectId}`);
        } else {
          const buffer = Buffer.from(fileBase64, 'base64');
          uploadResult = await uploadFile(buffer, fileName, fileType || 'application/octet-stream', `projects/${projectId}`);
        }
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          error: 'UploadError',
          message: '文件上传失败',
        });
      }

      const projectFile = await prisma.projectFile.create({
        data: {
          name: uploadResult.name,
          url: uploadResult.url,
          size: uploadResult.size,
          type: uploadResult.type,
          category,
          projectId: projectId as string,
          uploadedById: userId,
          taskId: taskId || null,
        },
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      });

      return res.status(201).json({
        success: true,
        data: projectFile,
        message: '文件上传成功',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'MethodNotAllowed',
      message: '不支持的请求方法',
    });
  },
  {
    requirePermission: 'file:upload',
    requireProjectAccess: true,
  }
);
