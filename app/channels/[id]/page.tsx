'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Clock, Copy, Monitor, SkipForward, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import DurationBinsChart from '@/components/DurationBinsChart';
import QuestionGroupHeatmap from '@/components/QuestionGroupHeatmap';
import AbnormalSampleList from '@/components/AbnormalSampleList';
import { useApp } from '@/lib/context/AppContext';
import { 
  getQualityScoreColor, 
  getQualityScoreBgColor, 
  cn 
} from '@/lib/utils';
import { Sample, Channel } from '@/lib/mockData';
import { Users } from 'lucide-react';

interface ChannelDetailData {
  channel: Channel;
  samples: Sample[];
  durationBins: { label: string; count: number }[];
  abnormalSamples: Sample[];
}

interface UserOption {
  id: string;
  username: string;
  displayName: string;
  roleId: string;
  roleName?: string;
}

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: '系统管理员', color: 'text-red-700', bg: 'bg-red-50' },
  research_manager: { label: '调研经理', color: 'text-blue-700', bg: 'bg-blue-50' },
  viewer: { label: '只读用户', color: 'text-gray-700', bg: 'bg-gray-100' },
};

export default function ChannelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.id as string;
  
  const { pendingCount, refreshAll } = useApp();
  const [data, setData] = useState<ChannelDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type?: 'success' | 'error' } | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const userSelectorRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/channels/${channelId}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('获取渠道详情失败:', error);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const result = await res.json();
      if (result.success) {
        setUsers(result.data);
        if (result.data.length > 0) {
          setSelectedUser(result.data[1]);
        }
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, [channelId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSelectorRef.current && !userSelectorRef.current.contains(event.target as Node)) {
        setShowUserSelector(false);
      }
    };
    
    if (showUserSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserSelector]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    if (!selectedUser) {
      showToast('请选择导出用户', 'error');
      return;
    }
    
    const exportUrl = `/api/export/samples?channelId=${channelId}&format=csv&userId=${selectedUser.id}`;
    
    fetch(exportUrl, { method: 'GET' })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          return res.json().then(data => {
            showToast(data.error || '没有导出权限', 'error');
          });
        }
        if (res.ok) {
          return res.blob().then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `samples_${channelId}_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('导出成功');
          });
        }
        return res.json().then(data => {
          showToast(data.error || '导出失败', 'error');
        });
      })
      .catch(() => {
        showToast('导出失败，请重试', 'error');
      });
  };

  const handleMarkSample = async (sampleId: string, action: 'approve' | 'reject') => {
    try {
      const actionType = action === 'approve' ? 'approved' : 'rejected';
      const res = await fetch('/api/review-queue/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sampleId, 
          action: actionType, 
          reviewer: '调研经理' 
        }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        await refreshAll();
        await fetchData();
        showToast(result.message);
      } else {
        showToast(result.error || '操作失败');
      }
    } catch (error) {
      console.error('标记样本失败:', error);
      showToast('操作失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar pendingCount={0} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
            <div className="h-32 bg-gray-200 rounded-xl mb-6" />
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded-xl" />
              <div className="h-80 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar pendingCount={pendingCount} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>渠道不存在</p>
        </div>
      </div>
    );
  }

  const { channel, samples, durationBins, abnormalSamples } = data;
  const questionGroupDurations = samples.map(s => s.questionGroupDurations);

  const totalAbnormal = channel.fastAnswerCount + channel.duplicateSubmissionCount + 
    channel.deviceConcentrationCount + channel.skipAbnormalCount + channel.openCopyCount;

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
        {toast?.show && (
          <div className={cn(
            'fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 animate-slide-in',
            toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          )}>
            <div className="w-5 h-5 flex items-center justify-center">
              {toast.type === 'error' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            {toast.message}
          </div>
        )}

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
                onClick={fetchData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                刷新
              </button>
              
              <div className="relative" ref={userSelectorRef}>
                <button
                  onClick={() => setShowUserSelector(!showUserSelector)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  <Users className="w-4 h-4" />
                  {selectedUser ? selectedUser.displayName : '选择用户'}
                  {selectedUser && selectedUser.roleName && (
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-xs',
                      roleLabels[selectedUser.roleName]?.color,
                      roleLabels[selectedUser.roleName]?.bg
                    )}>
                      {roleLabels[selectedUser.roleName]?.label}
                    </span>
                  )}
                </button>
                
                {showUserSelector && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-40 overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs text-gray-500">选择导出用户角色测试权限</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {users.map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserSelector(false);
                          }}
                          className={cn(
                            'w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0',
                            selectedUser?.id === user.id && 'bg-blue-50'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{user.displayName}</span>
                            {user.roleName && (
                              <span className={cn(
                                'px-1.5 py-0.5 rounded text-xs',
                                roleLabels[user.roleName]?.color,
                                roleLabels[user.roleName]?.bg
                              )}>
                                {roleLabels[user.roleName]?.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">@{user.username}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
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
                需调研经理审核确认，复核通过后质量分才更新
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
