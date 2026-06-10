'use client';

import { useState } from 'react';
import { Download, Search, Filter, ArrowUpRight } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { mockDonations } from '@/lib/mock/data';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format';

export default function DonationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  const filteredDonations = mockDonations
    .filter(d => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (!d.is_anonymous && d.donor_name.toLowerCase().includes(query)) ||
          d.payment_method.toLowerCase().includes(query) ||
          d.message?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .filter(d => {
      if (timeFilter === 'all') return true;
      const now = new Date();
      const date = new Date(d.created_at);
      if (timeFilter === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        const dQuarter = Math.floor(date.getMonth() / 3);
        return dQuarter === quarter && date.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'year') {
        return date.getFullYear() === now.getFullYear();
      }
      return true;
    });

  const totalAmount = mockDonations.reduce((sum, d) => sum + d.amount, 0);
  const thisMonthAmount = mockDonations
    .filter(d => {
      const now = new Date();
      const date = new Date(d.created_at);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + d.amount, 0);
  const donorCount = new Set(mockDonations.map(d => d.donor_name || 'anonymous')).size;

  const handleExport = () => {
    alert('导出功能：CSV 文件已生成（模拟）');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">捐赠明细</h1>
          <p className="text-gray-500">查看和管理所有捐赠记录</p>
        </div>
        <Button icon={Download} onClick={handleExport}>
          导出明细
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">累计筹款</p>
            <p className="text-3xl font-bold text-primary-600 font-serif">{formatCurrency(totalAmount)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">本月筹款</p>
            <p className="text-3xl font-bold text-green-600 font-serif">{formatCurrency(thisMonthAmount)}</p>
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> 较上月 +15%
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">捐赠笔数</p>
            <p className="text-3xl font-bold text-gray-900 font-serif">{mockDonations.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">捐赠人数</p>
            <p className="text-3xl font-bold text-purple-600 font-serif">{donorCount}</p>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          icon={Search}
          placeholder="搜索捐赠人姓名、支付方式或留言..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select
          icon={Filter}
          className="w-40"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          options={[
            { value: 'all', label: '全部时间' },
            { value: 'month', label: '本月' },
            { value: 'quarter', label: '本季度' },
            { value: 'year', label: '本年' },
          ]}
        />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 font-serif">捐赠记录</h2>
          <span className="text-sm text-gray-500">共 {filteredDonations.length} 条记录</span>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">捐赠人</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方式</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">留言</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">捐赠时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {donation.is_anonymous ? '匿' : donation.donor_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {donation.is_anonymous ? '匿名爱心人士' : donation.donor_name}
                          </p>
                          {donation.is_recurring && (
                            <Badge variant="primary" className="text-xs">月捐</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">+{formatCurrency(donation.amount)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline">{donation.payment_method}</Badge>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {donation.message ? (
                        <p className="text-sm text-gray-600 truncate" title={donation.message}>
                          {donation.message}
                        </p>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(donation.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
