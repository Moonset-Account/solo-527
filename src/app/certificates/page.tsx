'use client';

import { useState } from 'react';
import { Upload, FileCheck, Clock, AlertTriangle, CheckCircle, Plus, Eye, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const mockCertificates = [
  {
    id: '1',
    name: '场发射扫描电子显微镜操作证书',
    device: '场发射扫描电子显微镜',
    certificateId: 'SEM-2024-001',
    issuedAt: '2024-03-15',
    expiresAt: '2025-03-15',
    status: 'VERIFIED',
    fileUrl: '#',
    verifiedBy: '王管理员',
    verifiedAt: '2024-03-16',
  },
  {
    id: '2',
    name: 'X射线衍射仪操作证书',
    device: 'X射线衍射仪',
    certificateId: 'XRD-2024-002',
    issuedAt: '2024-04-20',
    expiresAt: '2025-04-20',
    status: 'PENDING',
    fileUrl: '#',
  },
  {
    id: '3',
    name: '400MHz核磁共振仪操作证书',
    device: '400MHz核磁共振仪',
    certificateId: 'NMR-2023-003',
    issuedAt: '2023-06-10',
    expiresAt: '2024-06-10',
    status: 'EXPIRED',
    fileUrl: '#',
    verifiedBy: '李管理员',
    verifiedAt: '2023-06-11',
  },
];

const statusConfig: Record<string, { label: string; variant: string; icon: any }> = {
  VERIFIED: { label: '已验证', variant: 'success', icon: CheckCircle },
  PENDING: { label: '待审核', variant: 'warning', icon: Clock },
  EXPIRED: { label: '已过期', variant: 'destructive', icon: AlertTriangle },
};

export default function CertificatesPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">资格证书</h1>
          <p className="text-slate-500 mt-1">管理设备操作资格证书</p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          上传证书
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm">已验证证书</p>
                <p className="text-3xl font-bold text-green-800 mt-1">
                  {mockCertificates.filter((c) => c.status === 'VERIFIED').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-700 text-sm">待审核</p>
                <p className="text-3xl font-bold text-amber-800 mt-1">
                  {mockCertificates.filter((c) => c.status === 'PENDING').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-700 text-sm">已过期</p>
                <p className="text-3xl font-bold text-red-800 mt-1">
                  {mockCertificates.filter((c) => c.status === 'EXPIRED').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-4 px-6 text-slate-500 font-medium">证书名称</th>
                  <th className="text-left py-4 px-6 text-slate-500 font-medium">对应设备</th>
                  <th className="text-left py-4 px-6 text-slate-500 font-medium">证书编号</th>
                  <th className="text-left py-4 px-6 text-slate-500 font-medium">有效期</th>
                  <th className="text-left py-4 px-6 text-slate-500 font-medium">状态</th>
                  <th className="text-left py-4 px-6 text-slate-500 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {mockCertificates.map((cert) => {
                  const config = statusConfig[cert.status];
                  const StatusIcon = config.icon;
                  return (
                    <tr key={cert.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-slate-500" />
                          </div>
                          <span className="font-medium text-slate-800">{cert.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{cert.device}</td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-sm">{cert.certificateId}</td>
                      <td className="py-4 px-6">
                        <div className="text-slate-600">
                          <div>{cert.issuedAt}</div>
                          <div className="text-slate-400">至 {cert.expiresAt}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={config.variant as any} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCertificate(cert);
                              setPreviewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          {cert.status === 'EXPIRED' && (
                            <Button variant="ghost" size="sm" className="text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传资格证书</DialogTitle>
            <DialogDescription>
              上传设备操作资格证书，管理员审核通过后即可预约对应设备
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">证书名称</label>
              <Input className="mt-1" placeholder="例如：扫描电子显微镜操作证书" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">证书编号</label>
              <Input className="mt-1" placeholder="请输入证书编号" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">发证日期</label>
              <Input type="date" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">有效期至</label>
              <Input type="date" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">证书文件</label>
              <div className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-primary-300 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">点击或拖拽上传文件</p>
                <p className="text-slate-400 text-sm mt-1">支持 PDF、JPG、PNG 格式</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                取消
              </Button>
              <Button>提交审核</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>证书详情</DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <FileCheck className="w-8 h-8 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{selectedCertificate.name}</h3>
                    <p className="text-slate-500">{selectedCertificate.certificateId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">对应设备:</span>
                    <span className="ml-2 text-slate-700">{selectedCertificate.device}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">发证日期:</span>
                    <span className="ml-2 text-slate-700">{selectedCertificate.issuedAt}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">有效期至:</span>
                    <span className="ml-2 text-slate-700">{selectedCertificate.expiresAt}</span>
                  </div>
                  {selectedCertificate.verifiedBy && (
                    <div>
                      <span className="text-slate-500">验证人:</span>
                      <span className="ml-2 text-slate-700">{selectedCertificate.verifiedBy}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
