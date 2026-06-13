'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { TaskWithRelations, Attachment } from '@/types';
import { formatFileSize, formatDate, cn } from '@/lib/utils';
import { Upload, FileText, Download, Trash2, Paperclip, AlertCircle } from 'lucide-react';

interface AttachmentUploaderProps {
  task: TaskWithRelations;
  onUpdate: () => void;
}

export default function AttachmentUploader({ task, onUpdate }: AttachmentUploaderProps) {
  const currentUser = useStore((state) => state.currentUser);
  const uploadAttachment = useStore((state) => state.uploadAttachment);
  const deleteAttachment = useStore((state) => state.deleteAttachment);
  const users = useStore((state) => state.users);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = currentUser?.role === 'admin' ||
    currentUser?.id === task.assignee_id ||
    currentUser?.id === task.creator_id;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        await uploadAttachment({
          task_id: task.id,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          file_content: reader.result as string,
        });
        onUpdate();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('确定要删除此附件吗？此操作将记录在审计日志中。')) return;
    await deleteAttachment(attachmentId);
    onUpdate();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📎';
  };

  const getUploaderName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || '未知用户';
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-primary-900" />
          附件管理
          {task.requires_attachment && (
            <span className="text-xs text-danger-500 font-normal">（必填）</span>
          )}
        </h3>
        <span className="text-sm text-gray-500">
          {task.attachments?.length || 0} 个文件
        </span>
      </div>

      {task.requires_attachment && (!task.attachments || task.attachments.length === 0) && (
        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger-700">
            此事项要求必须上传附件才能完成。请上传相关证明材料。
          </p>
        </div>
      )}

      {canEdit && (
        <div className="mb-4">
          <label className="block w-full">
            <div className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
              isUploading
                ? 'border-primary-300 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            )}>
              <Upload className={cn('w-8 h-8 mx-auto mb-2', isUploading ? 'text-primary-500 animate-bounce' : 'text-gray-400')} />
              <p className="text-sm text-gray-600">
                {isUploading ? '上传中...' : '点击或拖拽文件到此处上传'}
              </p>
              <p className="text-xs text-gray-400 mt-1">支持所有文件类型，单文件最大 50MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      <div className="space-y-3">
        {(!task.attachments || task.attachments.length === 0) ? (
          <div className="text-center py-6 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm">暂无附件</p>
          </div>
        ) : (
          task.attachments
            .sort((a, b) => b.version - a.version)
            .map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
              >
                <div className="text-2xl">{getFileIcon(attachment.mime_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{attachment.file_name}</p>
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                      v{attachment.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>{formatFileSize(attachment.file_size)}</span>
                    <span>上传者：{getUploaderName(attachment.uploaded_by)}</span>
                    <span>{formatDate(attachment.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 hover:bg-white rounded-md text-gray-500 hover:text-primary-600 transition-colors"
                    title="下载"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(attachment.id)}
                      className="p-2 hover:bg-white rounded-md text-gray-500 hover:text-danger-600 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
