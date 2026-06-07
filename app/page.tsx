import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import QualityCard from '@/components/QualityCard';
import { mockChannels, mockReviewQueue } from '@/lib/mockData';

export default async function HomePage() {
  const pendingCount = mockReviewQueue.filter(r => r.status === 'pending').length;
  const channels = mockChannels;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar pendingCount={pendingCount} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">渠道质量概览</h1>
          <p className="text-gray-600">实时监控各投放渠道的问卷样本质量</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <QualityCard key={channel.id} channel={channel} />
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">质量指标说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-700">答题过快</p>
              <p className="text-xs text-orange-600 mt-1">总答题时长小于60秒的样本</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-700">重复提交</p>
              <p className="text-xs text-red-600 mt-1">相同设备IP多次提交的样本</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-700">设备集中</p>
              <p className="text-xs text-purple-600 mt-1">单设备提交超过3份的样本</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-700">跳题异常</p>
              <p className="text-xs text-yellow-600 mt-1">跳过超过50%题目的样本</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <p className="text-sm font-medium text-pink-700">开放题复制</p>
              <p className="text-xs text-pink-600 mt-1">开放题答案相似度高于80%</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
