'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Search,
  Filter,
  Clock,
  ChevronRight,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { mockServiceTemplates } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';

const categories = [
  { id: 'all', name: '全部项目' },
  { id: '保养', name: '保养服务' },
  { id: '检测', name: '检测服务' },
  { id: '维修', name: '维修服务' },
];

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredServices = mockServiceTemplates.filter((service) => {
    if (!service.is_active) return false;
    if (activeCategory !== 'all' && service.category !== activeCategory) return false;
    if (searchQuery && !service.name.includes(searchQuery) && !service.description.includes(searchQuery)) return false;
    return true;
  });

  const groupedServices = categories.reduce((acc, cat) => {
    if (cat.id === 'all') return acc;
    acc[cat.id] = mockServiceTemplates.filter((s) => s.category === cat.id && s.is_active);
    return acc;
  }, {} as Record<string, typeof mockServiceTemplates>);

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-dark-900 font-display mb-4">
            检测服务项目
          </h1>
          <p className="text-dark-600 max-w-2xl mx-auto">
            专业的汽车保养检测服务，透明报价，品质保证
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-xl shadow-sm border border-dark-200 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
              <Input
                placeholder="搜索服务项目..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4" />
              筛选
            </Button>
          </div>
        </div>

        {/* 分类 Tabs */}
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full justify-start mb-8 bg-transparent p-0 border-b border-dark-200 h-auto rounded-none">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary-600 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary-600 rounded-none px-4 py-3 -mb-px"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </TabsContent>

          {categories.filter((c) => c.id !== 'all').map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices
                  .filter((s) => s.category === cat.id)
                  .map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {filteredServices.length === 0 && (
          <div className="text-center py-16">
            <Wrench className="h-12 w-12 text-dark-300 mx-auto mb-4" />
            <p className="text-dark-500">暂无符合条件的服务项目</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: typeof mockServiceTemplates[0] }) {
  return (
    <Card hoverable className="group flex flex-col">
      <div className="h-36 bg-gradient-to-br from-primary-100 to-primary-50 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Wrench className="h-14 w-14 text-primary-300" />
        </div>
        <Badge className="absolute top-3 left-3" variant="primary">
          {service.category}
        </Badge>
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full text-xs text-dark-600">
          <Clock className="h-3 w-3" />
          {service.duration_minutes}分钟
        </div>
      </div>
      <CardContent className="flex-1 flex flex-col pt-5">
        <h3 className="font-semibold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors">
          {service.name}
        </h3>
        <p className="text-sm text-dark-500 flex-1 mb-4 line-clamp-2">
          {service.description}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-dark-100">
          <div>
            <span className="text-2xl font-bold text-primary-600 font-display">
              {formatCurrency(service.price)}
            </span>
          </div>
          <Link href={`/booking?service=${service.id}`}>
            <Button size="sm">
              立即预约
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
