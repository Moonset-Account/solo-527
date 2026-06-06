'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardStats {
  todayMeetings: number;
  pendingVisitors: number;
  pendingTasks: number;
  activeRooms: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    todayMeetings: 0,
    pendingVisitors: 0,
    pendingTasks: 0,
    activeRooms: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [meetingsRes, visitorsRes, roomsRes] = await Promise.all([
          fetch('/api/meetings'),
          fetch('/api/visitors?status=INVITED'),
          fetch('/api/rooms'),
        ]);

        const [meetingsData, visitorsData, roomsData] = await Promise.all([
          meetingsRes.json(),
          visitorsRes.json(),
          roomsRes.json(),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayMeetings = (meetingsData.meetings || []).filter((m: any) => {
          const startTime = new Date(m.startTime);
          return startTime >= today && startTime < tomorrow;
        }).length;

        setStats({
          todayMeetings,
          pendingVisitors: (visitorsData.visitors || []).length,
          pendingTasks: 0,
          activeRooms: (roomsData.rooms || []).length,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const statCards = [
    {
      title: '今日会议',
      value: stats.todayMeetings,
      color: 'bg-blue-500',
      link: '/meetings',
    },
    {
      title: '待到访访客',
      value: stats.pendingVisitors,
      color: 'bg-green-500',
      link: '/visitors',
    },
    {
      title: '可用会议室',
      value: stats.activeRooms,
      color: 'bg-purple-500',
      link: '/calendar',
    },
    {
      title: '待办任务',
      value: stats.pendingTasks,
      color: 'bg-orange-500',
      link: '/front-desk',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">欢迎回来</h1>
        <p className="text-gray-600 mt-1">企业访客与会议室联动系统</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link key={card.title} href={card.link} className="block">
            <div className="card hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-3xl font-bold mt-2">
                    {loading ? '...' : card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-xl">📊</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">快速操作</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/meetings/create"
              className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <span className="text-2xl mr-3">➕</span>
              <div>
                <p className="font-medium text-primary-700">创建会议</p>
                <p className="text-sm text-primary-600">预约会议室并邀请访客</p>
              </div>
            </Link>
            <Link
              href="/calendar"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl mr-3">📅</span>
              <div>
                <p className="font-medium text-green-700">查看日历</p>
                <p className="text-sm text-green-600">会议室预约情况</p>
              </div>
            </Link>
            <Link
              href="/visitors"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-2xl mr-3">👥</span>
              <div>
                <p className="font-medium text-purple-700">访客管理</p>
                <p className="text-sm text-purple-600">查看访客记录</p>
              </div>
            </Link>
            <Link
              href="/front-desk"
              className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <span className="text-2xl mr-3">🏢</span>
              <div>
                <p className="font-medium text-orange-700">前台工作台</p>
                <p className="text-sm text-orange-600">核验证件与登记</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">系统说明</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="text-primary-500 mr-2">✓</span>
              <p>创建会议时自动生成访客邀请、二维码和门禁权限</p>
            </div>
            <div className="flex items-start">
              <span className="text-primary-500 mr-2">✓</span>
              <p>访客到场时前台核验证件并拍照留存（72小时自动删除）</p>
            </div>
            <div className="flex items-start">
              <span className="text-primary-500 mr-2">✓</span>
              <p>访客离场后门禁权限自动撤销</p>
            </div>
            <div className="flex items-start">
              <span className="text-primary-500 mr-2">✓</span>
              <p>会议取消/改期自动同步访客二维码，已入场访客单独提示前台</p>
            </div>
            <div className="flex items-start">
              <span className="text-primary-500 mr-2">✓</span>
              <p>普通员工仅可查看本部门自己创建的会议访客</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
