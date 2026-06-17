'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Printer,
  Download,
  Filter,
  DollarSign,
  CheckCircle,
  Clock,
  FileX,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { mockInvoices, mockAppointments } from '@/lib/mockData';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

export default function InvoicesPage() {
  const { setCurrentPageTitle } = useUIStore();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCurrentPageTitle('收银单管理');
  }, [setCurrentPageTitle]);

  const filteredInvoices = mockInvoices.filter((inv) => {
    if (activeTab !== 'all' && inv.status !== activeTab) return false;
    if (searchQuery && !inv.invoice_no.includes(searchQuery)) return false;
    return true;
  });

  const totalRevenue = mockInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.final_amount, 0);

  const pendingAmount = mockInvoices
    .filter((i) => i.status === 'issued')
    .reduce((sum, i) => sum + i.final_amount, 0);

  const statusTabs = [
    { value: 'all', label: '全部', count: mockInvoices.length },
    { value: 'draft', label: '草稿', count: mockInvoices.filter((i) => i.status === 'draft').length },
    { value: 'issued', label: '已开具', count: mockInvoices.filter((i) => i.status === 'issued').length },
    { value: 'paid', label: '已支付', count: mockInvoices.filter((i) => i.status === 'paid').length },
    { value: 'cancelled', label: '已作废', count: mockInvoices.filter((i) => i.status === 'cancelled').length },
  ];

  const paymentMethodLabels: Record<string, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
    card: '银行卡',
    cash: '现金',
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">今日营收</p>
                <p className="text-2xl font-bold text-success-600 font-display">
                  {formatCurrency(12580)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success-50 text-success-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">累计营收</p>
                <p className="text-2xl font-bold text-dark-900 font-display">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">待收款</p>
                <p className="text-2xl font-bold text-amber-600 font-display">
                  {formatCurrency(pendingAmount)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">本月单数</p>
                <p className="text-2xl font-bold text-dark-900 font-display">
                  {mockInvoices.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">收银单列表</CardTitle>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="搜索单号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<Search className="h-4 w-4 text-dark-400" />}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增收银单
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              {statusTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                  {tab.label}
                  <Badge variant="secondary" size="sm">{tab.count}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {statusTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>单据编号</TableHead>
                      <TableHead>客户信息</TableHead>
                      <TableHead>总金额</TableHead>
                      <TableHead>优惠</TableHead>
                      <TableHead>实收金额</TableHead>
                      <TableHead>支付方式</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => {
                      const appointment = mockAppointments.find(
                        (a) => a.id === invoice.appointment_id
                      );
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <span className="font-mono font-medium text-dark-900">
                              {invoice.invoice_no}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-dark-900">
                              {appointment?.customer_name || '-'}
                            </div>
                            <div className="text-xs text-dark-500">
                              {appointment?.car_plate || ''}
                            </div>
                          </TableCell>
                          <TableCell className="text-dark-500">
                            {formatCurrency(invoice.total_amount)}
                          </TableCell>
                          <TableCell className="text-danger-600">
                            -{formatCurrency(invoice.discount + invoice.member_discount)}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-primary-600">
                              {formatCurrency(invoice.final_amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {invoice.payment_method
                              ? paymentMethodLabels[invoice.payment_method] || invoice.payment_method
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(invoice.status)} size="sm">
                              {getStatusLabel(invoice.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-dark-500 text-sm">
                            {formatDateTime(invoice.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Printer className="h-4 w-4" />
                              </Button>
                              {invoice.status === 'issued' && (
                                <Button variant="ghost" size="sm" className="text-success-600">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-danger-600"
                                >
                                  <FileX className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
