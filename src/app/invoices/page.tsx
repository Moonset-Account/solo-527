'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Receipt, DollarSign, BarChart3, Users, Settings } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900">发票管理</h1>
        <p className="text-slate-500 mt-1">开具发票、跟踪付款状态、自动提醒</p>
      </div>
      <Card>
        <CardContent className="text-center py-16">
          <Receipt className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">发票模块</h3>
          <p className="text-slate-500">功能开发中，敬请期待</p>
        </CardContent>
      </Card>
    </div>
  );
}
