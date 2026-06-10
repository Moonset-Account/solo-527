'use client';

import Link from 'next/link';
import {
  Heart,
  Users,
  Clock,
  BookOpen,
  TrendingUp,
  Image as ImageIcon,
  AlertTriangle,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getDashboardStats, mockVisits, mockExceptions, mockDonations } from '@/lib/mock/data';
import { formatCurrency, formatDate, formatNumber, getExceptionStatusLabel, getExceptionStatusColor, getVisitStatusLabel, getVisitStatusColor } from '@/lib/utils/format';

export default function DashboardPage() {
  const stats = getDashboardStats();
  const recentVisits = mockVisits.slice(0, 4);
  const recentDonations = mockDonations.slice(0, 5);
  const pendingExceptions = mockExceptions.filter(e => e.status !== 'closed').slice(0, 3);

  const statCards = [
    { label: '累计筹款', value: formatCurrency(stats.totalRaised), icon: Heart, color: 'from-primary-500 to-primary-600', change: '+12.5%' },
    { label: '已支出', value: formatCurrency(stats.totalExpenses), icon: TrendingUp, color: 'from-blue-500 to-blue-600', change: '-3.2%' },
    { label: '受益学生', value: `${formatNumber(stats.beneficiaryCount)}人`, icon: Users, color: 'from-secondary-500 to-secondary-600', change: '+8人' },
    { label: '服务时长', value: `${formatNumber(stats.serviceHours)}h`, icon: Clock, color: 'from-purple-500 to-purple-600', change: '+120h' },
    { label: '探访次数', value: `${formatNumber(stats.visitCount)}次`, icon: BookOpen, color: 'from-amber-500 to-amber-600', change: '+1次' },
    { label: '捐赠笔数', value: `${formatNumber(stats.donationCount)}笔`, icon: Heart, color: 'from-pink-500 to-pink-600', change: '+3笔' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">仪表盘</h1>
        <p className="text-gray-500">欢迎回来，这里是项目的最新概览</p>
      </div>

      {(stats.pendingPhotos > 0 || stats.openExceptions > 0) && (
        <div className="flex flex-wrap gap-4">
          {stats.pendingPhotos > 0 && (
            <Link
              href="/admin/photos"
              className="flex items-center gap-3 px-5 py-4 bg-yellow-50 border border-yellow-200 rounded-2xl hover:bg-yellow-100 transition-colors"
            >
              <div className="p-2 bg-yellow-500 rounded-xl">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-yellow-800">{stats.pendingPhotos} 张照片待审核</p>
                <p className="text-sm text-yellow-600">点击处理</p>
              </div>
            </Link>
          )}
          {stats.openExceptions > 0 && (
            <Link
              href="/admin/exceptions"
              className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl hover:bg-red-100 transition-colors animate-pulse"
            >
              <div className="p-2 bg-red-500 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-red-800">{stats.openExceptions} 个异常待处理</p>
                <p className="text-sm text-red-600">需要及时处理</p>
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} hover>
            <CardBody>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${card.color} rounded-xl shadow-lg`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <Badge variant="success">{card.change}</Badge>
              </div>
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 font-serif">{card.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 font-serif">最新探访记录</h2>
            <Link href="/admin/visits" className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {recentVisits.map((visit) => (
                <Link
                  key={visit.id}
                  href={`/admin/visits/${visit.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-primary-100 rounded-xl">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{visit.location}</p>
                    <p className="text-sm text-gray-500">{formatDate(visit.visit_date)}</p>
                  </div>
                  <Badge className={getVisitStatusColor(visit.status)}>
                    {getVisitStatusLabel(visit.status)}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 font-serif">最新捐赠</h2>
            <Link href="/admin/donations" className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {recentDonations.map((donation) => (
                <div key={donation.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {donation.is_anonymous ? '匿' : donation.donor_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {donation.is_anonymous ? '匿名爱心人士' : donation.donor_name}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(donation.created_at)}</p>
                  </div>
                  <p className="font-semibold text-green-600">+{formatCurrency(donation.amount)}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {pendingExceptions.length > 0 && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 font-serif flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              待处理异常
            </h2>
            <Link href="/admin/exceptions" className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {pendingExceptions.map((exception) => (
                <Link
                  key={exception.id}
                  href={`/admin/exceptions/${exception.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"
                >
                  <div className="p-2 bg-red-500 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{exception.title}</p>
                    <p className="text-sm text-gray-500 truncate">{exception.impact_scope}</p>
                  </div>
                  <Badge className={getExceptionStatusColor(exception.status)}>
                    {getExceptionStatusLabel(exception.status)}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
