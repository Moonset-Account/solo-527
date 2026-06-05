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

export default function NewProductionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    director: '',
    posterUrl: '',
    startDate: '',
    endDate: '',
  });

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
    const file = new File([blob], `poster-${Date.now()}.jpg`, { type: mimeType });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'posters');

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
      let posterUrl = formData.posterUrl;
      if (posterUrl.startsWith('drama_club_photo_')) {
        posterUrl = await uploadOfflinePhoto(posterUrl);
      }

      const res = await fetch('/api/v1/productions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          posterUrl,
        }),
      });

      if (res.ok) {
        router.push('/productions');
      }
    } catch (error) {
      console.error('Failed to create production:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/productions"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            新建剧目
          </h1>
          <p className="text-gray-500 mt-1">创建一个新的剧目项目</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              剧目名称 *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="请输入剧目名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              剧目海报
            </label>
            <FileUpload
              value={formData.posterUrl}
              onChange={(url) => setFormData({ ...formData, posterUrl: url })}
              uploadType="posters"
              accept="image/*"
              label=""
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              剧目简介
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              placeholder="请输入剧目简介"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                编剧
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="请输入编剧姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                导演
              </label>
              <input
                type="text"
                value={formData.director}
                onChange={(e) =>
                  setFormData({ ...formData, director: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="请输入导演姓名"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始日期
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                结束日期
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <Link
              href="/productions"
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
              <span>{loading ? '创建中...' : '创建剧目'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
