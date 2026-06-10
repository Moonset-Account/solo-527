'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats, getSettingByKey } from '@/lib/services/data';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import type { DashboardStats } from '@/lib/types';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projectName, setProjectName] = useState('阳光助学计划');
  const [slogan, setSlogan] = useState('每一份爱心，点亮一个未来');

  useEffect(() => {
    setIsVisible(true);
    getDashboardStats().then(setStats);
    getSettingByKey('project_name').then(v => { if (v) setProjectName(String(v)); });
    getSettingByKey('project_slogan').then(v => { if (v) setSlogan(String(v)); });
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('温暖的阳光洒进山区教室，孩子们在明亮的教室里专注学习，希望与梦想，公益摄影，大场景构图')}&image_size=landscape_16_9)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-primary-900/70 z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className={`max-w-3xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 animate-fade-in">
            <Heart className="w-4 h-4 text-primary-400 fill-primary-400" />
            <span className="text-sm text-white/90">公益项目 · 透明公开</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight font-serif">
            {projectName}
          </h1>

          <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed">
            {slogan}
          </p>

          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-4xl md:text-5xl font-bold text-white font-serif">
                {stats ? formatCurrency(stats.totalRaised) : '—'}
              </p>
              <p className="text-white/60 text-sm mt-1">累计筹款</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <p className="text-4xl md:text-5xl font-bold text-white font-serif">
                {stats ? formatNumber(stats.beneficiaryCount) : '—'}
              </p>
              <p className="text-white/60 text-sm mt-1">受益学生</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <p className="text-4xl md:text-5xl font-bold text-white font-serif">
                {stats ? formatNumber(stats.serviceHours) : '—'}
              </p>
              <p className="text-white/60 text-sm mt-1">服务时长</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <Link
              href="/progress"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              了解项目进展
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/finance"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all"
            >
              查看资金使用
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-warm-50 to-transparent z-10" />
    </section>
  );
}
