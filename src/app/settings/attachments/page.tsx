'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Paperclip, Upload, Download, FileText, Trash2 } from 'lucide-react';
import { formatFileSize, formatDateTime } from '@/lib/utils';

const templates = [
  { id: '1', name: '装修合同标准模板.docx', size: 245760, uploaded_by: '系统管理员', uploaded_at: '2025-05-01 10:00' },
  { id: '2', name: '量房确认单.pdf', size: 153600, uploaded_by: '系统管理员', uploaded_at: '2025-05-01 10:00' },
  { id: '3', name: '报价单模板.xlsx', size: 81920, uploaded_by: '张明远', uploaded_at: '2025-06-05 14:30' },
  { id: '4', name: '设计方案交付确认单.pdf', size: 204800, uploaded_by: '系统管理员', uploaded_at: '2025-05-01 10:00' },
];

export default function AttachmentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-primary-500" />
                合同附件模板
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">维护装修合同、报价单等常用文档模板，支持上传下载</p>
            </div>
            <Button leftIcon={<Upload className="h-4 w-4" />}>上传模板</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-5 py-3.5 font-medium">文件名称</th>
                    <th className="px-5 py-3.5 font-medium">文件大小</th>
                    <th className="px-5 py-3.5 font-medium">上传人</th>
                    <th className="px-5 py-3.5 font-medium">上传时间</th>
                    <th className="px-5 py-3.5 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {templates.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary-500" />
                          </div>
                          <span className="font-medium text-gray-800">{f.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 font-mono">{formatFileSize(f.size)}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{f.uploaded_by}</td>
                      <td className="px-5 py-4 text-xs text-gray-400">{f.uploaded_at}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-colors">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
