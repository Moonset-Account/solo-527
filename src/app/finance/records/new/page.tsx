'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowLeft,
  Loader2,
  Save,
  WifiOff,
} from 'lucide-react';
import { FileUpload } from '@/components/shared/FileUpload';
import { useOfflineSync } from '@/components/shared/OfflineSyncProvider';
import { formQueue, uploadOfflinePhoto } from '@/lib/offline-storage';
import Link from 'next/link';

export default function NewFinanceRecordPage() {
  const router = useRouter();
  const { isOnline, onFormSynced } = useOfflineSync();
  const [loading, setLoading] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
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

  useEffect(() => {
    const unsubscribe = onFormSynced((formType, result) => {
      if (formType === 'finance') {
        router.push('/finance/records');
      }
    });
    return unsubscribe;
  }, [onFormSynced, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isOnline) {
        formQueue.add(
          'finance',
          '/api/v1/finance/records',
          {
            ...formData,
            amount: parseFloat(formData.amount),
          },
          [
            {
              fieldName: 'receiptUrl',
              storageKey: formData.receiptUrl,
              uploadType: 'receipts',
            },
          ]
        );
        setOfflineSaved(true);
        return;
      }

      let receiptUrl = formData.receiptUrl;
      if (receiptUrl.startsWith('drama_club_photo_')) {
        const uploaded = await uploadOfflinePhoto(receiptUrl, 'receipts');
        receiptUrl = uploaded || '';
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

  if (offlineSaved) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/finance/records"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="h-10 w-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            已离线暂存
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            当前处于离线状态，财务记录数据已保存到本地。
            恢复网络连接后将自动上传并创建记录。
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => router.push('/finance/records')}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>返回财务记录</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/finance/records"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-display font-bold text-gray-900">
            新增财务记录
          </h1>
          <p className="text-gray-500 mt-1">录入新的收入或支出记录</p>
        </div>
        {!isOnline && (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
            <WifiOff className="h-4 w-4" />
            <span>离线模式</span>
          </div>
        )}
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
              <span>{loading ? '保存中...' : isOnline ? '保存记录' : '离线暂存'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
