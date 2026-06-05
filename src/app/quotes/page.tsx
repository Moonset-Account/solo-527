'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';

export default function QuotesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">报价单</h1>
          <p className="text-slate-500 mt-1">管理和发送项目报价</p>
        </div>
        <Link href="/quotes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建报价
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="text-center py-16">
          <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">报价单模块</h3>
          <p className="text-slate-500 mb-6">支持报价模板、版本追溯、客户确认提醒</p>
          <p className="text-sm text-slate-400">功能开发中，敬请期待</p>
        </CardContent>
      </Card>
    </div>
  );
}
