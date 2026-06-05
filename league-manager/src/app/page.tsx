'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Users, Shield, Calendar, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '@/types';

const roleDashboard: Record<UserRole, string> = {
  admin: '/admin',
  captain: '/captain',
  referee: '/referee',
  viewer: '/standings',
};

export default function HomePage() {
  const router = useRouter();
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user) {
      router.replace(roleDashboard[user.role]);
    }
  }, [user, router]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">正在跳转...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2 text-white">
            <Trophy size={28} className="text-[#F9A825]" />
            <span className="font-bold text-xl">业余联赛管理系统</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/standings"
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              积分榜
            </Link>
            <Link
              href="/schedule"
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              赛程
            </Link>
            <Link
              href="/login"
              className="text-sm bg-white text-[#1B5E20] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              登录
            </Link>
          </div>
        </nav>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            业余联赛管理系统
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            一站式管理球队报名、赛程安排、比分录入与申诉处理，让业余联赛运营更高效
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link
              href="/login"
              className="bg-[#F9A825] text-[#1B5E20] px-6 py-3 rounded-lg font-bold text-lg hover:bg-[#F9F2D0] transition-colors inline-flex items-center gap-2"
            >
              立即登录 <ArrowRight size={20} />
            </Link>
            <Link
              href="/standings"
              className="bg-white/10 text-white px-6 py-3 rounded-lg font-medium text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              查看积分榜
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-[#F9A825] rounded-lg flex items-center justify-center mb-4">
              <Shield size={24} className="text-[#1B5E20]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">领队管理</h3>
            <p className="text-sm text-white/70">
              球队注册、球员名单管理、比分确认、申诉提交
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-[#F9A825] rounded-lg flex items-center justify-center mb-4">
              <Calendar size={24} className="text-[#1B5E20]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">赛程管理</h3>
            <p className="text-sm text-white/70">
              自动生成赛程、裁判指派、场地安排、实时比分录入
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-[#F9A825] rounded-lg flex items-center justify-center mb-4">
              <Users size={24} className="text-[#1B5E20]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">裁判管理</h3>
            <p className="text-sm text-white/70">
              裁判指派、比分录入、比赛事件记录
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center py-8 text-white/40 text-sm mt-16">
        © 2024 业余联赛管理系统
      </footer>
    </div>
  );
}
