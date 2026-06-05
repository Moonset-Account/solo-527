'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Building,
  Briefcase,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  totalRevenue: number;
  activeProjects: number;
  completedProjects: number;
  status: 'active' | 'inactive' | 'prospect';
  createdAt: string;
}

const mockClients: Client[] = [
  {
    id: 'c1',
    name: '张经理',
    company: '阿里巴巴集团',
    email: 'zhang.manager@alibaba.com',
    phone: '138****8888',
    totalRevenue: 180000,
    activeProjects: 2,
    completedProjects: 5,
    status: 'active',
    createdAt: '2023-06-15T00:00:00.000Z',
  },
  {
    id: 'c2',
    name: '李总监',
    company: '腾讯科技',
    email: 'li.director@tencent.com',
    phone: '139****6666',
    totalRevenue: 120000,
    activeProjects: 1,
    completedProjects: 3,
    status: 'active',
    createdAt: '2023-08-20T00:00:00.000Z',
  },
  {
    id: 'c3',
    name: '王产品',
    company: '字节跳动',
    email: 'wang.product@bytedance.com',
    phone: '137****5555',
    totalRevenue: 95000,
    activeProjects: 2,
    completedProjects: 2,
    status: 'active',
    createdAt: '2023-10-10T00:00:00.000Z',
  },
  {
    id: 'c4',
    name: '赵设计',
    company: '美团点评',
    email: 'zhao.design@meituan.com',
    phone: '136****4444',
    totalRevenue: 45000,
    activeProjects: 0,
    completedProjects: 2,
    status: 'inactive',
    createdAt: '2023-05-01T00:00:00.000Z',
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: '活跃', color: 'bg-green-100 text-green-700' },
  inactive: { label: '不活跃', color: 'bg-slate-100 text-slate-600' },
  prospect: { label: '潜在', color: 'bg-blue-100 text-blue-700' },
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setClients(mockClients);
      setIsLoading(false);
    }, 500);
  }, []);

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">客户管理</h1>
          <p className="text-slate-500 mt-1">管理客户信息、查看合作历史和财务数据</p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新增客户
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索客户姓名、公司或邮箱..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </form>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          筛选
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary/70">客户总数</p>
                <p className="text-3xl font-bold text-primary mt-1">{totalClients}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">活跃客户</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{activeClients}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-200/50">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">累计收入</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-200/50">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((client, index) => (
            <Card
              key={client.id}
              className={`overflow-hidden animate-fade-in animate-stagger-${(index % 4) + 1}`}
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-xl font-bold">
                        {client.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{client.name}</h3>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[client.status].color}`}
                          >
                            {statusConfig[client.status].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                          <Building className="w-4 h-4" />
                          {client.company}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {client.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {client.phone}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">
                        {client.activeProjects + client.completedProjects}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">合作项目</p>
                    </div>
                    <div className="text-center border-x border-slate-100">
                      <p className="text-2xl font-bold text-green-600">
                        {client.activeProjects}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">进行中</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(client.totalRevenue).slice(0, 5)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">累计收入</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link href={`/clients/${client.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        查看详情
                      </Button>
                    </Link>
                    <Link href={`/portal?client=${client.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        客户门户
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">暂无客户</h3>
            <p className="text-slate-500 mb-6">添加您的第一位客户开始合作</p>
            <Link href="/clients/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增客户
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
