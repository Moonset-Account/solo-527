'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Clock, Copy, Monitor, SkipForward, FileText, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import DurationBinsChart from '@/components/DurationBinsChart';
import QuestionGroupHeatmap from '@/components/QuestionGroupHeatmap';
import AbnormalSampleList from '@/components/AbnormalSampleList';
import { 
  generateMockSamples, 
  mockChannels, 
  mockReviewQueue, 
  getDurationBins, 
  Sample, 
  Channel 
} from '@/lib/mockData';
import { 
  getQualityScoreColor, 
  getQualityScoreBgColor, 
  formatDuration, 
  cn 
} from '@/lib/utils';

export default function ChannelDetailPage() {
  const params = useParams();
  const channelId = params.id as string;
  
  const [channel, setChannel] = useState<Channel | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ch = mockChannels.find(c => c.id === channelId);
    if (ch) {
      setChannel(ch);
      const generatedSamples = generateMockSamples(channelId, 100);
      setSamples(generatedSamples);
    }
    setLoading(false);
  }, [channelId]);

  const pendingCount = mockReviewQueue.filter(r => r.status === 'pending').length;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar pendingCount={pendingCount} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
            <div className="h-32 bg-gray-200 rounded-xl mb-6" />
            <div className="grid grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded-xl" />
              <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar pendingCount={pendingCount} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>渠道不存在</p>
        </div>
      </div>
    );
  }

  const durations = samples.map(s => s.totalDuration);
  const durationBins = getDurationBins(durations);
  const abnormalSamples = samples.filter(s => s.abnormalTypes.length > 0);
  const questionGroupDurations = samples.map(s => s.questionGroupDurations);

  const totalAbnormal = channel.fastAnswerCount + channel.duplicateSubmissionCount + 
    channel.deviceConcentrationCount + channel.skipAbnormalCount + channel.openCopyCount;

  const handleExport = () => {
    window.open(`/api/export/samples?channelId=${channelId}&format=csv`, '_blank');
  };

  const handleMarkSample = (sampleId: string, action: 'approve' | 'reject') => {
    console.log(`标记样本 ${sampleId} 为 ${action}`);
    setSamples(prev => prev.map(s => 
      s.id === sampleId 
        ? { ...s, status: action === 'approve' ? 'approved' : 'rejected' }
        : s
    ));
  };

  const metrics = [
    { key: 'fastAnswerCount', label: '答题过快', icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50', value: channel.fastAnswerCount },
    { key: 'duplicateSubmissionCount', label: '重复提交', icon: Copy, color: 'text-red-600', bgColor: 'bg-red-50', value: channel.duplicateSubmissionCount },
    { key: 'deviceConcentrationCount', label: '设备集中', icon: Monitor, color: 'text-purple-600', bgColor: 'bg-purple-50', value: channel.deviceConcentrationCount },
    { key: 'skipAbnormalCount', label: '跳题异常', icon: SkipForward, color: 'text-yellow-600', bgColor: 'bg-yellow-50', value: channel.skipAbnormalCount },
    { key: 'openCopyCount', label: '开放题复制', icon: FileText, color: 'text-pink-600', bgColor: 'bg-pink-50', value: channel.openCopyCount },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar pendingCount={pendingCount} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            返回渠道列表
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{channel.name}</h1>
              <p className="text-gray-600">
                总样本量: {channel.totalSamples.toLocaleString()} · 
                更新时间: {channel.updatedAt}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {channel.pendingReview > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                  {channel.pendingReview} 条待复核
                </span>
              )}
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                导出数据
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className={cn('text-4xl font-bold', getQualityScoreColor(channel.qualityScore))}>
                {channel.qualityScore}
              </div>
              <div className="text-sm text-gray-500 mt-1">综合质量分</div>
            </div>
            
            <div className="flex-1">
              <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                <div
                  className={cn('h-3 rounded-full transition-all duration-500', getQualityScoreBgColor(channel.qualityScore))}
                  style={{ width: `${channel.qualityScore}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>较差</span>
                <span>一般</span>
                <span>良好</span>
                <span>优秀</span>
                <span>100</span>
              </div>
            </div>

            <div className="text-center border-l border-gray-200 pl-8">
              <div className="text-2xl font-bold text-gray-900">{totalAbnormal}</div>
              <div className="text-sm text-gray-500 mt-1">异常样本总数</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', metric.bgColor)}>
                    <Icon className={cn('w-5 h-5', metric.color)} />
                  </div>
                  <div>
                    <div className={cn('text-xl font-bold', metric.color)}>{metric.value}</div>
                    <div className="text-xs text-gray-500">{metric.label}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  占比 {((metric.value / channel.totalSamples) * 100).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DurationBinsChart bins={durationBins} />
          <QuestionGroupHeatmap 
            groupNames={['基本信息', '消费习惯', '品牌认知', '购买意向', '开放题']}
            sampleDurations={questionGroupDurations}
          />
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">质检结论</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-sm font-medium text-green-700 mb-1">有效样本</p>
              <p className="text-2xl font-bold text-green-600">
                {channel.totalSamples - totalAbnormal}
              </p>
              <p className="text-xs text-green-600 mt-1">
                占比 {(((channel.totalSamples - totalAbnormal) / channel.totalSamples) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm font-medium text-amber-700 mb-1">待复核样本</p>
              <p className="text-2xl font-bold text-amber-600">{channel.pendingReview}</p>
              <p className="text-xs text-amber-600 mt-1">
                需调研经理审核确认
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm font-medium text-red-700 mb-1">异常样本</p>
              <p className="text-2xl font-bold text-red-600">{totalAbnormal}</p>
              <p className="text-xs text-red-600 mt-1">
                占比 {((totalAbnormal / channel.totalSamples) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <AbnormalSampleList samples={abnormalSamples} onMark={handleMarkSample} />
      </main>
    </div>
  );
}
