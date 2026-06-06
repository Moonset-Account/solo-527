'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface QuoteItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([
    { id: 1, name: '', quantity: 1, unitPrice: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { id: Date.now(), name: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  const updateItem = (id: number, field: keyof QuoteItem, value: string | number) => {
    setItems(
      items.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          projectId: projectId || undefined,
          clientId: clientId || undefined,
          validUntil: validUntil || null,
          items: items.filter((i) => i.name.trim()),
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/quotes/${data.quote.id}`);
      }
    } catch (error) {
      console.error('创建失败', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/quotes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">新建报价单</h1>
          <p className="text-slate-500 mt-1">创建一份新的报价单发送给客户</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    报价标题 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="例如：官网设计项目报价"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      关联项目
                    </label>
                    <Input
                      placeholder="选择项目"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      客户
                    </label>
                    <Input
                      placeholder="选择客户"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      有效期至
                    </label>
                    <Input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>报价明细</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加项目
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-sm text-slate-500 mb-1 block">项目名称</label>
                      <Input
                        placeholder="服务名称"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-sm text-slate-500 mb-1 block">数量</label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="w-32">
                      <label className="text-sm text-slate-500 mb-1 block">单价</label>
                      <Input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-28 text-right">
                      <label className="text-sm text-slate-500 mb-1 block">小计</label>
                      <p className="font-medium text-slate-900 py-2">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-slate-500">总计</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>备注</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="添加备注信息..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 sticky top-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4">报价汇总</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">项目数</span>
                    <span className="text-slate-900">{items.filter((i) => i.name.trim()).length} 项</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">总数量</span>
                    <span className="text-slate-900">{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                  </div>
                  <div className="pt-3 border-t border-primary/20">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">报价总额</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Button type="submit" className="w-full" disabled={isSubmitting || !title.trim()}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? '保存中...' : '保存报价单'}
                  </Button>
                  <Link href="/quotes" className="block">
                    <Button variant="outline" className="w-full">
                      取消
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
