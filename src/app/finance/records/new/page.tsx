'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { FileUpload } from '@/components/shared/FileUpload';
import Link from 'next/link';

export default function NewFinanceRecordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: '',
    amount: '',
    description: '',
    receiptUrl: '',
    recordedAt: new Date().toISOString().split('T')[0],
  });

  const categories = {
    INCOME: ['票房收入', '赞助收入', '会员费', '其他收入'],
    EXPENSE: ['场地租赁', '道具采购', '服装制作', '宣传费用', '人员酬劳', '其他支出'],
  };

  const uploadOfflinePhoto = async (key: string): Promise<string> => {
    if (!key.startsWith('drama_club_photo_')) return key;

    const base64Data = localStorage.getItem(key);
    if (!base64Data) return '';

    const base64Parts = base64Data.split(',');
    const mimeType = base64Parts[0].match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
    const binaryString = atob(base64Parts[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: mimeType });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'receipts');

    const res = await fetch('/api/v1/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.removeItem(key);
      return data.url;
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let receiptUrl = formData.receiptUrl;
      if (receiptUrl.startsWith('drama_club_photo_')) {
        receiptUrl = await uploadOfflinePhoto(receiptUrl);
      }

      const res = await fetch('/api/v1/finance/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          receiptUrl,
          amount: parseFloat(formData.amount),
        }),
      });

      if (res.ok) {
        router.push('/finance/records');
      }
    } catch (error) {
      console.error('Failed to create finance record:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/finance/records"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            新增财务记录
          </h1>
          <p className="text-gray-500 mt-1">录入新的收入或支出记录</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              收支类型 *
            </label>
            <div className="flex space-x-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="INCOME"
                  checked={formData.type === 'INCOME'}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as 'INCOME', category: '' })
                  }
                  className="sr-only"
                />
                <div
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.type === 'INCOME'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">收入</span>
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="EXPENSE"
                  checked={formData.type === 'EXPENSE'}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as 'EXPENSE', category: '' })
                  }
                  className="sr-only"
                />
                <div
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.type === 'EXPENSE'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">支出</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类 *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="">请选择分类</option>
              {categories[formData.type].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              金额 *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                ¥
              </span>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              记录日期
            </label>
            <input
              type="date"
              value={formData.recordedAt}
              onChange={(e) =>
                setFormData({ ...formData, recordedAt: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注说明
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              placeholder="请输入备注说明"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              凭证附件（发票/收据）
            </label>
            <FileUpload
              value={formData.receiptUrl}
              onChange={(url) => setFormData({ ...formData, receiptUrl: url })}
              uploadType="receipts"
              accept="image/*,application/pdf"
              label=""
              allowCamera={true}
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Link
              href="/finance/records"
              className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              <span>{loading ? '保存中...' : '保存记录'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
