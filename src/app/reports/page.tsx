'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Download, Calendar, TrendingUp, BarChart3, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

const monthlyBookingsData = [
  { month: '1月', 预约量: 120, 完成量: 115 },
  { month: '2月', 预约量: 150, 完成量: 142 },
  { month: '3月', 预约量: 180, 完成量: 175 },
  { month: '4月', 预约量: 165, 完成量: 160 },
  { month: '5月', 预约量: 210, 完成量: 205 },
  { month: '6月', 预约量: 245, 完成量: 230 },
];

const deviceUtilizationData = [
  { name: '电子显微镜', 使用率: 85 },
  { name: 'X射线仪器', 使用率: 72 },
  { name: '核磁共振', 使用率: 90 },
  { name: '色谱分析', 使用率: 65 },
  { name: '质谱分析', 使用率: 78 },
  { name: '光学显微镜', 使用率: 55 },
];

const departmentUsageData = [
  { name: '材料学院', value: 35, color: '#3b82f6' },
  { name: '化学学院', value: 28, color: '#0d9488' },
  { name: '物理学院', value: 20, color: '#f59e0b' },
  { name: '生命学院', value: 17, color: '#ef4444' },
];

const topDevices = [
  { rank: 1, name: '400MHz核磁共振仪', bookings: 245, utilization: 90 },
  { rank: 2, name: '场发射扫描电子显微镜', bookings: 203, utilization: 85 },
  { rank: 3, name: 'X射线衍射仪', bookings: 189, utilization: 72 },
  { rank: 4, name: '激光共聚焦显微镜', bookings: 167, utilization: 78 },
  { rank: 5, name: '气相色谱质谱联用仪', bookings: 142, utilization: 68 },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-06-30');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">报表中心</h1>
          <p className="text-slate-500 mt-1">查看设备使用统计和数据报表</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            导出Excel
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-600">统计周期:</span>
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
            <span className="text-slate-400">至</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
            />
            <Button>更新统计</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">总预约数</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">1,075</p>
                <p className="text-green-600 text-xs mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  较上月 +12.5%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">设备使用率</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">74.2%</p>
                <p className="text-green-600 text-xs mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  较上月 +5.3%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">活跃用户</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">186</p>
                <p className="text-green-600 text-xs mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  较上月 +8.1%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">平均预约时长</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">3.8h</p>
                <p className="text-slate-400 text-xs mt-1">较上月 -0.2h</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">预约趋势</TabsTrigger>
          <TabsTrigger value="utilization">设备使用率</TabsTrigger>
          <TabsTrigger value="department">院系分布</TabsTrigger>
          <TabsTrigger value="ranking">设备排行</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>月度预约趋势</CardTitle>
              <CardDescription>近6个月预约数量和完成数量统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyBookingsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="预约量" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} />
                    <Line type="monotone" dataKey="完成量" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>设备类型使用率</CardTitle>
              <CardDescription>各类型设备的平均使用率对比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviceUtilizationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="使用率" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>各学院使用占比</CardTitle>
                <CardDescription>按预约数量统计的院系分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentUsageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {departmentUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>学院使用明细</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentUsageData.map((dept) => (
                    <div key={dept.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-700">{dept.name}</span>
                        <span className="font-medium">{dept.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${dept.value}%`, backgroundColor: dept.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ranking" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>热门设备排行</CardTitle>
              <CardDescription>按预约数量排序的热门设备</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">排名</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">设备名称</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">预约次数</th>
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">使用率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDevices.map((device) => (
                      <tr key={device.rank} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              device.rank <= 3
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {device.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{device.name}</td>
                        <td className="py-3 px-4 text-slate-600">{device.bookings} 次</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full">
                              <div
                                className="h-full rounded-full bg-primary-500"
                                style={{ width: `${device.utilization}%` }}
                              />
                            </div>
                            <span className="text-slate-600 text-sm">{device.utilization}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
