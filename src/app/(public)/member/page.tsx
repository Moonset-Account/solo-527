'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  CreditCard,
  Clock,
  Star,
  ChevronRight,
  Package,
  FileText,
  Settings,
  LogOut,
  Crown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { mockMembership, mockAppointments, mockMemberPlans } from '@/lib/mockData';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function MemberPage() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('appointments');

  const userAppointments = mockAppointments.filter((a) => a.user_id === 'user-001');

  const menuItems = [
    { icon: FileText, label: '我的预约', value: 'appointments', count: userAppointments.length },
    { icon: Package, label: '我的订单', value: 'orders' },
    { icon: Star, label: '我的收藏', value: 'favorites' },
  ];

  return (
    <div className="py-8 bg-dark-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧边栏 */}
          <div className="lg:col-span-1">
            {/* 用户信息卡片 */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold font-display">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900">{user?.name}</h3>
                    <p className="text-sm text-dark-500">{user?.phone}</p>
                    {mockMembership.status === 'active' && (
                      <Badge variant="warning" className="mt-1">
                        <Crown className="h-3 w-3 mr-1" />
                        {mockMembership.plan?.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 会员信息 */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">会员中心</CardTitle>
              </CardHeader>
              <CardContent>
                {mockMembership.status === 'active' ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-dark-500 text-sm">账户余额</span>
                      <span className="text-xl font-bold text-primary-600 font-display">
                        {formatCurrency(mockMembership.balance)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-4 text-sm">
                      <span className="text-dark-500">有效期至</span>
                      <span className="text-dark-700">{mockMembership.end_date}</span>
                    </div>
                    <Button variant="outline" fullWidth size="sm">
                      充值续费
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-dark-500 text-sm mb-3">您还不是会员</p>
                    <Link href="/">
                      <Button size="sm">立即开通</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 菜单 */}
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.value;
                    return (
                      <button
                        key={item.value}
                        onClick={() => setActiveTab(item.value)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-dark-600 hover:bg-dark-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </div>
                        {item.count !== undefined && (
                          <Badge variant="secondary" size="sm">{item.count}</Badge>
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="border-t border-dark-100 my-2" />

                <nav className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-600 hover:bg-dark-50 transition-colors">
                    <Settings className="h-5 w-5" />
                    账户设置
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    退出登录
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* 右侧内容区 */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="appointments" className="mt-0">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>我的预约</CardTitle>
                    <Link href="/booking">
                      <Button size="sm">
                        新建预约
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-4 border border-dark-200 rounded-xl hover:border-primary-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-dark-900">
                                  {apt.car_plate} - {apt.car_model}
                                </h4>
                                <Badge className={getStatusColor(apt.status)} size="sm">
                                  {getStatusLabel(apt.status)}
                                </Badge>
                              </div>
                              <p className="text-sm text-dark-500 mt-1">
                                预约单号：{apt.id}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary-600 font-display">
                                {formatCurrency(apt.total_amount)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-dark-500 mb-3">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              {formatDateTime(apt.appointment_time)}
                            </span>
                            {apt.technician && (
                              <span className="flex items-center gap-1.5">
                                <User className="h-4 w-4" />
                                {apt.technician.name}
                              </span>
                            )}
                            {apt.station && (
                              <span className="flex items-center gap-1.5">
                                <Package className="h-4 w-4" />
                                {apt.station.name}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-end">
                            <Link href={`/orders/${apt.id}`}>
                              <Button variant="outline" size="sm">
                                查看详情
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>

                    {userAppointments.length === 0 && (
                      <div className="text-center py-12">
                        <Clock className="h-12 w-12 text-dark-300 mx-auto mb-4" />
                        <p className="text-dark-500 mb-4">暂无预约记录</p>
                        <Link href="/booking">
                          <Button>立即预约</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>我的订单</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-dark-300 mx-auto mb-4" />
                      <p className="text-dark-500">订单功能开发中...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="favorites" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>我的收藏</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 text-dark-300 mx-auto mb-4" />
                      <p className="text-dark-500">收藏功能开发中...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
