'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import {
  Package,
  FileText,
  Shield,
  Truck,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { Exhibit, LoanApplication, InsurancePolicy, TransportHandover } from '@/types/database';
import { formatCurrency, statusLabels } from '@/lib/utils';

interface Stats {
  totalExhibits: number;
  onLoanExhibits: number;
  activeContracts: number;
  pendingApplications: number;
  activeInsurance: number;
  inTransit: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalExhibits: 0,
    onLoanExhibits: 0,
    activeContracts: 0,
    pendingApplications: 0,
    activeInsurance: 0,
    inTransit: 0,
  });
  const [recentApplications, setRecentApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [{ count: exhibitsCount }, { count: onLoanCount }, { count: contractsCount }, { count: pendingCount }, { count: insuranceCount }, { count: transitCount }, { data: applications }] = await Promise.all([
          supabase.from('exhibits').select('*', { count: 'exact', head: true }),
          supabase.from('exhibits').select('*', { count: 'exact', head: true }).eq('status', 'on_loan'),
          supabase.from('loan_contracts').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'in_progress']),
          supabase.from('loan_applications').select('*', { count: 'exact', head: true }).in('status', ['pending_review', 'awaiting_confirmation']),
          supabase.from('insurance_policies').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
          supabase.from('transport_handovers').select('*', { count: 'exact', head: true }).eq('status', 'in_transit'),
          supabase.from('loan_applications').select('*').order('created_at', { ascending: false }).limit(5),
        ]);

        setStats({
          totalExhibits: exhibitsCount || 0,
          onLoanExhibits: onLoanCount || 0,
          activeContracts: contractsCount || 0,
          pendingApplications: pendingCount || 0,
          activeInsurance: insuranceCount || 0,
          inTransit: transitCount || 0,
        });
        setRecentApplications(applications || []);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [supabase]);

  const statCards = [
    { label: '展品总数', value: stats.totalExhibits, icon: Package, color: 'from-blue-500 to-blue-600' },
    { label: '外借中', value: stats.onLoanExhibits, icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { label: '进行中合同', value: stats.activeContracts, icon: FileText, color: 'from-amber-500 to-orange-600' },
    { label: '待审核申请', value: stats.pendingApplications, icon: Clock, color: 'from-red-500 to-red-600' },
    { label: '有效保险单', value: stats.activeInsurance, icon: Shield, color: 'from-purple-500 to-purple-600' },
    { label: '运输中', value: stats.inTransit, icon: Truck, color: 'from-indigo-500 to-indigo-600' },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-500 mt-1">展品借展管理系统概览</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">最近借展申请</h2>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>暂无借展申请记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">申请 #{app.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(app.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      app.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      app.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusLabels[app.status] || app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">待办事项提醒</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800">{stats.pendingApplications} 个申请待审核</p>
                  <p className="text-sm text-yellow-600">请及时处理借展申请</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">{stats.inTransit} 批展品运输中</p>
                  <p className="text-sm text-blue-600">请关注运输状态</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">保险核验</p>
                  <p className="text-sm text-green-600">定期检查保险单有效期</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
