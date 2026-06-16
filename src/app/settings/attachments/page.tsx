'use client';

import { useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { Paperclip, Upload, Download, FileText, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatFileSize, formatDateTime } from '@/lib/utils';
import { ContractAttachment } from '@/lib/types';

export default function AttachmentsPage() {
  const { attachments, currentUser, addAttachment, deleteAttachment } = useAppStore();
  const templates = attachments.filter((a) => a.is_template);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !currentUser) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const urlSafeName = encodeURIComponent(file.name);
        const timestamp = Date.now();
        const fileUrl = `/templates/${timestamp}-${urlSafeName}`;

        const record: Omit<ContractAttachment, 'id' | 'created_at'> = {
          lead_id: null,
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          file_url: fileUrl,
          is_template: true,
          uploaded_by: currentUser.id,
          uploaded_by_name: currentUser.name,
        };

        await addAttachment(record);
      }

      setSuccess(`成功上传 ${files.length} 个文件到数据库`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || '上传失败，数据库写入错误');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = (att: ContractAttachment) => {
    if (!att.file_url || att.file_url.startsWith('/')) {
      setError('文件未上传到对象存储，仅保存了元数据记录。\n请配置 Supabase Storage 以启用实际文件存储。');
      setTimeout(() => setError(null), 5000);
      return;
    }
    window.open(att.file_url, '_blank');
  };

  const handleDelete = async (att: ContractAttachment) => {
    if (!confirm(`确定删除附件"${att.file_name}"？此操作将从数据库中移除该记录。`)) return;
    try {
      setError(null);
      await deleteAttachment(att.id);
      setSuccess(`已从数据库删除 "${att.file_name}"`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || '删除失败');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm whitespace-pre-line">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>{success}</div>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-primary-500" />
                合同附件模板
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                维护装修合同、报价单等常用文档模板。元数据写入
                <code className="mx-1 bg-gray-100 px-1.5 py-0.5 rounded text-xs">contract_attachments</code>
                表。
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <Button
                leftIcon={<Upload className="h-4 w-4" />}
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                上传模板
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-5 py-3.5 font-medium">文件名称</th>
                    <th className="px-5 py-3.5 font-medium">文件类型</th>
                    <th className="px-5 py-3.5 font-medium">文件大小</th>
                    <th className="px-5 py-3.5 font-medium">上传人</th>
                    <th className="px-5 py-3.5 font-medium">上传时间</th>
                    <th className="px-5 py-3.5 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-10 w-10 text-gray-300" />
                          <div>暂无附件模板，点击右上角"上传模板"开始添加</div>
                          <div className="text-xs">元数据将持久化到 PostgreSQL</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    templates.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary-500" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-800 truncate">{f.file_name}</div>
                              <div className="text-[10px] text-gray-400 font-mono truncate">
                                id: {f.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500 font-mono truncate max-w-[180px]">
                          {f.file_type}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 font-mono">
                          {formatFileSize(f.file_size)}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {f.uploaded_by_name}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-400">
                          {formatDateTime(f.created_at)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownload(f)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                              title="下载 / 查看"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(f)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="从数据库删除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
