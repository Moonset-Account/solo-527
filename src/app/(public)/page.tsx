'use client';

import Link from 'next/link';
import {
  Wrench,
  Shield,
  Clock,
  Star,
  ChevronRight,
  Calendar,
  Award,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mockServiceTemplates, mockMemberPlans, mockTechnicians } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';

export default function HomePage() {
  const featuredServices = mockServiceTemplates.filter((s) => s.is_active).slice(0, 4);
  const features = [
    { icon: Shield, title: '品质保证', description: '原厂配件，专业技师，质保无忧' },
    { icon: Clock, title: '快速服务', description: '预约即享，无需等待，高效完成' },
    { icon: Star, title: '透明报价', description: '明码标价，无隐形消费' },
    { icon: Award, title: '会员专享', description: '多重优惠，积分好礼' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 bg-white/10 text-white border border-white/20">
              专业维保 · 值得信赖
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
              您的爱车
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent"> 专业养护</span>
              <br />
              从这里开始
            </h1>
            <p className="text-lg text-dark-300 mb-8 max-w-xl">
              一站式汽车保养维修服务平台，在线预约、透明报价、专业技师、品质保障。
              让每一次维保都省心、放心。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/booking">
                <Button size="lg" className="bg-accent-500 hover:bg-accent-600 text-white">
                  <Calendar className="h-5 w-5" />
                  立即预约
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  查看服务
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 mt-12">
              <div>
                <div className="text-3xl font-bold font-display">10,000+</div>
                <div className="text-sm text-dark-400">服务客户</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <div className="text-3xl font-bold font-display">98%</div>
                <div className="text-sm text-dark-400">满意度</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <div className="text-3xl font-bold font-display">8年</div>
                <div className="text-sm text-dark-400">行业经验</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-900 font-display mb-4">
              为什么选择我们
            </h2>
            <p className="text-dark-600 max-w-2xl mx-auto">
              专业的团队，优质的服务，透明的价格，为您的爱车提供全方位呵护
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} hoverable className="text-center">
                  <CardContent className="pt-8">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Icon className="h-7 w-7 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-dark-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-dark-500">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-dark-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-dark-900 font-display mb-2">
                热门服务项目
              </h2>
              <p className="text-dark-600">精选热门保养检测项目，专业呵护您的爱车</p>
            </div>
            <Link
              href="/services"
              className="hidden md:flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              查看全部
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredServices.map((service) => (
              <Card key={service.id} hoverable className="group">
                <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-50 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wrench className="h-16 w-16 text-primary-300" />
                  </div>
                  <Badge className="absolute top-3 right-3" variant="primary">
                    {service.category}
                  </Badge>
                </div>
                <CardContent className="pt-5">
                  <h3 className="font-semibold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-dark-500 line-clamp-2 mb-4">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary-600 font-display">
                        {formatCurrency(service.price)}
                      </span>
                      <span className="text-sm text-dark-400 ml-1">起</span>
                    </div>
                    <Link href={`/booking?service=${service.id}`}>
                      <Button size="sm">预约</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technicians */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-900 font-display mb-4">
              专业技师团队
            </h2>
            <p className="text-dark-600 max-w-2xl mx-auto">
              经验丰富的技师团队，持证上岗，为您提供专业可靠的服务
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockTechnicians.slice(0, 4).map((tech) => (
              <Card key={tech.id} hoverable className="text-center">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold font-display">
                    {tech.name.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-dark-900 mb-1">{tech.name}</h3>
                  <Badge variant="secondary" className="mb-3">
                    {tech.status === 'available' ? '在岗' : '忙碌'}
                  </Badge>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {tech.skills.split(',').slice(0, 2).map((skill, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-dark-100 text-dark-600 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 md:p-12 text-white">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold font-display mb-4">
                加入会员，尊享更多优惠
              </h2>
              <p className="text-primary-100 mb-6 text-lg">
                会员专享折扣、免费检测、优先工位、专属客服等多重权益
              </p>
              <div className="flex flex-wrap gap-4">
                {mockMemberPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white/10 border border-white/20 rounded-xl p-5 min-w-48"
                  >
                    <div className="text-lg font-semibold mb-2">{plan.name}</div>
                    <div className="text-3xl font-bold font-display mb-3">
                      {formatCurrency(plan.price)}
                      <span className="text-sm font-normal text-primary-200">/年</span>
                    </div>
                    <Link href="/member">
                      <Button variant="outline" size="sm" className="w-full border-white/30 text-white hover:bg-white/10">
                        了解详情
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
