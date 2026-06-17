import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { ticketApi } from '@/api/ticketApi';
import type { CreateTicketData, TicketPriority, TicketCategory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input, TextArea } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import {
  TICKET_PRIORITY_OPTIONS,
  TICKET_CATEGORY_OPTIONS,
} from '@/utils/constants';

export default function TicketCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTicketData>({
    title: '',
    description: '',
    priority: 'medium' as TicketPriority,
    category: 'other' as TicketCategory,
    customerName: '',
    customerPhone: '',
    orderNo: '',
    tags: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = '请输入工单标题';
    if (!formData.description.trim()) newErrors.description = '请输入工单描述';
    if (!formData.customerName.trim()) newErrors.customerName = '请输入客户姓名';
    if (!formData.customerPhone.trim()) newErrors.customerPhone = '请输入客户电话';
    else if (!/^1[3-9]\d{9}$/.test(formData.customerPhone)) newErrors.customerPhone = '请输入有效的手机号';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await ticketApi.createTicket(formData);
      if (response.success) {
        navigate(`/tickets/${response.data.id}`);
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof CreateTicketData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors"
          onClick={() => navigate('/tickets')}
        >
          <ArrowLeft className="h-5 w-5" />
          返回工单列表
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">创建工单</h1>
          <p className="text-zinc-500 mt-1">创建新的售后工单</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  工单标题 <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="请输入工单标题"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  error={errors.title}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  工单类型 <span className="text-red-500">*</span>
                </label>
                <Select
                  options={TICKET_CATEGORY_OPTIONS}
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  优先级 <span className="text-red-500">*</span>
                </label>
                <Select
                  options={TICKET_PRIORITY_OPTIONS}
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  关联订单号
                </label>
                <Input
                  placeholder="请输入关联订单号"
                  value={formData.orderNo}
                  onChange={(e) => handleChange('orderNo', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                工单描述 <span className="text-red-500">*</span>
              </label>
              <TextArea
                placeholder="请详细描述问题..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                error={errors.description}
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>客户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  客户姓名 <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="请输入客户姓名"
                  value={formData.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  error={errors.customerName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="请输入联系电话"
                  value={formData.customerPhone}
                  onChange={(e) => handleChange('customerPhone', e.target.value)}
                  error={errors.customerPhone}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/tickets')}
          >
            取消
          </Button>
          <Button type="submit" leftIcon={<Save className="h-4 w-4" />} isLoading={loading}>
            保存工单
          </Button>
        </div>
      </form>
    </div>
  );
}
