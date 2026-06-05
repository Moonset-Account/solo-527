'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  AlertCircle, 
  FileText, 
  Plus, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  Calendar,
  MessageSquare
} from 'lucide-react';
import type { Appeal, AppealStatus, AppealType } from '@/lib/types';

const AppealFormSchema = z.object({
  matchId: z.string().min(1, '请选择比赛'),
  type: z.enum(['SCORE', 'FOUL', 'REFEREE', 'ELIGIBILITY', 'OTHER']),
  title: z.string().min(5, '申诉标题至少5个字符'),
  description: z.string().min(10, '申诉描述至少10个字符'),
});

type AppealForm = z.infer<typeof AppealFormSchema>;

const appealTypeLabels: Record<AppealType, string> = {
  SCORE: '比分争议',
  FOUL: '犯规判罚',
  REFEREE: '裁判问题',
  ELIGIBILITY: '参赛资格',
  OTHER: '其他',
};

const appealStatusConfig: Record<AppealStatus, { label: string; style: string; icon: any }> = {
  PENDING: {
    label: '待处理',
    style: 'bg-warning/10 text-warning',
    icon: Clock,
  },
  REVIEWING: {
    label: '审核中',
    style: 'bg-info/10 text-info',
    icon: Search,
  },
  UPHELD: {
    label: '申诉通过',
    style: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
  REJECTED: {
    label: '申诉驳回',
    style: 'bg-danger/10 text-danger',
    icon: XCircle,
  },
};

const mockMatches = [
  { _id: '1', homeTeam: '猛虎队', awayTeam: '飞鹰队', round: 3, date: '2024-01-15' },
  { _id: '2', homeTeam: '烈焰队', awayTeam: '风暴队', round: 3, date: '2024-01-15' },
  { _id: '3', homeTeam: '闪电队', awayTeam: '雷霆队', round: 2, date: '2024-01-10' },
];

const mockAppeals: Appeal[] = [
  {
    _id: '1',
    matchId: '1',
    teamId: 't1',
    submittedBy: 'u1',
    type: 'SCORE',
    title: '第三节比分统计错误',
    description: '第三节比赛结束时，我方实际得分应为28分而非25分，请求核实录像。',
    evidenceUrls: [],
    status: 'PENDING',
    submittedAt: new Date('2024-01-16T10:00:00'),
    deadline: new Date('2024-01-18T10:00:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    matchId: '2',
    teamId: 't2',
    submittedBy: 'u2',
    type: 'FOUL',
    title: '关键判罚有误',
    description: '比赛最后两分钟的一次进攻犯规判罚存在争议，影响了比赛结果。',
    evidenceUrls: [],
    status: 'REVIEWING',
    submittedAt: new Date('2024-01-15T15:30:00'),
    deadline: new Date('2024-01-17T15:30:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '3',
    matchId: '3',
    teamId: 't3',
    submittedBy: 'u3',
    type: 'ELIGIBILITY',
    title: '对方球员参赛资格问题',
    description: '经核实，对方球队的12号球员不在本赛季注册名单中。',
    evidenceUrls: [],
    status: 'UPHELD',
    submittedAt: new Date('2024-01-11T09:00:00'),
    deadline: new Date('2024-01-13T09:00:00'),
    decidedAt: new Date('2024-01-12T14:00:00'),
    decidedBy: 'admin1',
    decision: '经核查情况属实，已取消该球员参赛资格。',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '4',
    matchId: '1',
    teamId: 't4',
    submittedBy: 'u4',
    type: 'REFEREE',
    title: '裁判执法尺度不一',
    description: '整场比赛裁判对双方的判罚标准不一致，我方多次合理对抗被吹罚。',
    evidenceUrls: [],
    status: 'REJECTED',
    submittedAt: new Date('2024-01-14T20:00:00'),
    deadline: new Date('2024-01-16T20:00:00'),
    decidedAt: new Date('2024-01-15T11:00:00'),
    decidedBy: 'admin2',
    decision: '经回看比赛录像，裁判判罚符合规则，驳回申诉。',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function AppealsPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'submit'>('list');
  const [appeals, setAppeals] = useState<Appeal[]>(mockAppeals);
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppeals = async () => {
    try {
      const res = await fetch('/api/appeals');
      const data = await res.json();
      if (data.success && data.data) {
        setAppeals(data.data);
      }
    } catch (error) {
      console.error('获取申诉列表失败:', error);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppealForm>({
    resolver: zodResolver(AppealFormSchema),
  });

  useEffect(() => {
    fetchAppeals();
  }, []);

  const onSubmit = async (data: AppealForm) => {
    try {
      const res = await fetch('/api/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          teamId: 'default-team',
          evidenceUrls: evidenceFiles,
        }),
      });
      const result = await res.json();
      if (result.success) {
        reset();
        setEvidenceFiles([]);
        setActiveTab('list');
        fetchAppeals();
      }
    } catch (error) {
      console.error('提交申诉失败:', error);
    }
  };

  const getMatchInfo = (matchId: string) => {
    const match = mockMatches.find(m => m._id === matchId);
    if (match) {
      return `${match.homeTeam} vs ${match.awayTeam} (第${match.round}轮)`;
    }
    return '未知比赛';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-text-primary flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-secondary" />
          申诉中心
        </h1>
        <p className="text-text-secondary mt-1">
          提交和查看比赛申诉
        </p>
      </div>

      <div className="bg-surface rounded-xl border border-border mb-6">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-medium transition-colors relative ${
              activeTab === 'list'
                ? 'text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              我的申诉
            </span>
            {activeTab === 'list' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-medium transition-colors relative ${
              activeTab === 'submit'
                ? 'text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              提交申诉
            </span>
            {activeTab === 'submit' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {activeTab === 'list' && (
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
                    <div className="skeleton h-5 w-1/3 mb-2 rounded" />
                    <div className="skeleton h-4 w-2/3 mb-3 rounded" />
                    <div className="flex gap-2">
                      <div className="skeleton h-6 w-16 rounded-full" />
                      <div className="skeleton h-6 w-24 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : appeals.length > 0 ? (
              <div className="space-y-4">
                {appeals.map((appeal) => {
                  const statusConfig = appealStatusConfig[appeal.status];
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div
                      key={appeal._id}
                      className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-text-primary">
                              {appeal.title}
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.style}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                            {appeal.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {appealTypeLabels[appeal.type]}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              {getMatchInfo(appeal.matchId)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(appeal.submittedAt).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {appeal.decision && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-text-secondary">
                            <span className="font-medium text-text-primary">处理结果：</span>
                            {appeal.decision}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
                <h3 className="font-bold text-text-primary text-lg mb-2">暂无申诉记录</h3>
                <p className="text-text-secondary mb-4">
                  您还没有提交过任何申诉
                </p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  提交第一条申诉
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submit' && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  选择比赛 <span className="text-danger">*</span>
                </label>
                <select
                  {...register('matchId')}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 appearance-none cursor-pointer"
                >
                  <option value="">请选择需要申诉的比赛</option>
                  {mockMatches.map((match) => (
                    <option key={match._id} value={match._id}>
                      {match.homeTeam} vs {match.awayTeam} - 第{match.round}轮 ({match.date})
                    </option>
                  ))}
                </select>
                {errors.matchId && (
                  <p className="mt-1 text-xs text-danger">{errors.matchId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  申诉类型 <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(appealTypeLabels).map(([value, label]) => (
                    <label
                      key={value}
                      className="relative flex items-center justify-center p-2.5 border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <input
                        type="radio"
                        value={value}
                        {...register('type')}
                        className="sr-only"
                      />
                      <span className="text-sm text-text-primary">{label}</span>
                    </label>
                  ))}
                </div>
                {errors.type && (
                  <p className="mt-1 text-xs text-danger">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  申诉标题 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="请简要描述申诉问题"
                  {...register('title')}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-danger">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  申诉描述 <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="请详细描述申诉的具体情况和理由..."
                  {...register('description')}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  证据上传
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">点击或拖拽上传证据图片</p>
                  <p className="text-xs text-text-muted mt-1">支持 JPG、PNG 格式，最多上传5张</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
                >
                  <Plus className="w-4 h-4" />
                  提交申诉
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
