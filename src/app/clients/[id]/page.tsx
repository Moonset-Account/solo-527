'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Edit,
  ExternalLink,
  FileText,
  Receipt,
  CheckCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  totalRevenue: number;
  activeProjects: number;
  completedProjects: number;
  status: 'active' | 'inactive' | 'prospect';
  createdAt: string;
  notes: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mockClient: Client = {
      id: params.id as string,
      name: '张经理',
      company: '阿里巴巴集团',
      email: 'zhang.manager@alibaba.com',
      phone: '138****8888',
      address: '杭州市余杭区文一西路969号',
      totalRevenue: 180000,
      activeProjects: 2,
      completedProjects: 5,
      status: 'active',
      createdAt: '2023-06-15T00:00:00.000Z',
      notes: '重要客户，优先响应',
    };
    setClient(mockClient);
    setIsLoading(false);
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-100 rounded w-48" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16">
        <User className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">客户不存在</h3>
        <Link href="/clients">
          <Button>返回客户列表</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-2xl font-bold">
            {client.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-slate-900">{client.name}</h1>
            <p className="text-slate-500">{client.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/portal?client=${client.id}`} target="_blank">
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              客户门户
            </Button>
          </Link>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            编辑
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">累计收入</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatCurrency(client.totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">进行中项目</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {client.activeProjects}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">已完成项目</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {client.completedProjects}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">合作时间</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {Math.floor((Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))} 月
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-100">
                <Calendar className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>联系信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">邮箱</p>
                  <p className="text-slate-900">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">电话</p>
                  <p className="text-slate-900">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">公司</p>
                  <p className="text-slate-900">{client.company}</p>
                </div>
              </div>
              {client.address && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">地址</p>
                    <p className="text-slate-900">{client.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>备注</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/quotes/new?client=${client.id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  新建报价单
                </Button>
              </Link>
              <Link href={`/invoices/new?client=${client.id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Receipt className="w-4 h-4 mr-2" />
                  开具发票
                </Button>
              </Link>
              <Link href={`/projects/new?client=${client.id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="w-4 h-4 mr-2" />
                  新建项目
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">客户状态</span>
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  活跃
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">创建时间</span>
                <span className="text-slate-900">{formatDate(client.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
