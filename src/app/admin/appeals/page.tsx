'use client';

import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search,
  Clock,
  MessageSquare,
  FileText,
  X,
  Save
} from 'lucide-react';
import type { Appeal, AppealStatus, AppealType } from '@/lib/types';

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

const mockAppeals: Appeal[] = [
  {
    _id: '1',
    matchId: 'm1',
    teamId: 't1',
    submittedBy: 'u1',
    type: 'SCORE',
    title: '第三节比分统计错误',
    description: '第三节比赛结束时，我方实际得分应为28分而非25分，请求核实录像。第三节最后时刻我方球员投中一记三分球，但记录表上未计入。',
    evidenceUrls: [],
    status: 'PENDING',
    submittedAt: new Date('2024-01-16T10:00:00'),
    deadline: new Date('2024-01-18T10:00:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    matchId: 'm2',
    teamId: 't2',
    submittedBy: 'u2',
    type: 'FOUL',
    title: '关键判罚有误',
    description: '比赛最后两分钟的一次进攻犯规判罚存在争议，影响了比赛结果。当时我方球员正在上篮，对方球员明显提前移动，但裁判反而吹罚了我方进攻犯规。',
    evidenceUrls: [],
    status: 'REVIEWING',
    submittedAt: new Date('2024-01-15T15:30:00'),
    deadline: new Date('2024-01-17T15:30:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '3',
    matchId: 'm3',
    teamId: 't3',
    submittedBy: 'u3',
    type: 'ELIGIBILITY',
    title: '对方球员参赛资格问题',
    description: '经核实，对方球队的12号球员不在本赛季注册名单中。该球员在多场比赛中出场并获得大量分数，严重影响了比赛公平性。',
    evidenceUrls: [],
    status: 'UPHELD',
    submittedAt: new Date('2024-01-11T09:00:00'),
    deadline: new Date('2024-01-13T09:00:00'),
    decidedAt: new Date('2024-01-12T14:00:00'),
    decidedBy: 'admin1',
    decision: '经核查情况属实，已取消该球员参赛资格，并判该场比赛对方0-20告负。',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '4',
    matchId: 'm1',
    teamId: 't4',
    submittedBy: 'u4',
    type: 'REFEREE',
    title: '裁判执法尺度不一',
    description: '整场比赛裁判对双方的判罚标准不一致，我方多次合理对抗被吹罚，而对方同样的动作却未被吹罚。',
    evidenceUrls: [],
    status: 'REJECTED',
    submittedAt: new Date('2024-01-14T20:00:00'),
    deadline: new Date('2024-01-16T20:00:00'),
    decidedAt: new Date('2024-01-15T11:00:00'),
    decidedBy: 'admin2',
    decision: '经回看比赛录像，裁判判罚符合规则，双方尺度一致，驳回申诉。',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const matchNames: Record<string, string> = {
  m1: '猛虎队 vs 飞鹰队 (第1轮)',
  m2: '烈焰队 vs 风暴队 (第1轮)',
  m3: '闪电队 vs 雷霆队 (第2轮)',
};

const teamNames: Record<string, string> = {
  t1: '猛虎队',
  t2: '烈焰队',
  t3: '闪电队',
  t4: '飞鹰队',
};

export default function AdminAppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>(mockAppeals);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [decision, setDecision] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      const res = await fetch('/api/appeals');
      const data = await res.json();
      if (data.success && data.data) {
        setAppeals(data.data);
      }
    } catch (error) {
      console.error('获取申诉列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppeals = appeals.filter((appeal) => {
    const matchesSearch =
      appeal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appeal.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || appeal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (
    appealId: string,
    status: AppealStatus,
    decisionText?: string
  ) => {
    setProcessingId(appealId);
    try {
      await fetch(`/api/appeals/${appealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          decision: decisionText,
        }),
      });
      setAppeals((prev) =>
        prev.map((a) =>
          a._id === appealId
            ? {
                ...a,
                status,
                decision: decisionText,
                decidedAt: new Date(),
                decidedBy: 'current-admin',
              }
            : a
        )
      );
      setSelectedAppeal(null);
      setDecision('');
    } catch (error) {
      console.error('处理申诉失败:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = appeals.filter((a) => a.status === 'PENDING').length;
  const reviewingCount = appeals.filter((a) => a.status === 'REVIEWING').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-text-primary flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-secondary" />
          申诉处理
        </h1>
        <p className="text-text-secondary mt-1">
          处理球队提交的申诉
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">{pendingCount}</div>
            <div className="text-sm text-text-secondary">待处理申诉</div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center">
            <Search className="w-6 h-6 text-info" />
          </div>
          <div>
            <div className="text-2xl font-bold text-text-primary">{reviewingCount}</div>
            <div className="text-sm text-text-secondary">审核中</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="搜索申诉标题或内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="ALL">全部状态</option>
          <option value="PENDING">待处理</option>
          <option value="REVIEWING">审核中</option>
          <option value="UPHELD">申诉通过</option>
          <option value="REJECTED">申诉驳回</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="skeleton h-5 w-1/3 rounded" />
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
              <div className="skeleton h-4 w-2/3 mb-3 rounded" />
              <div className="flex gap-4">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-4 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAppeals.length > 0 ? (
        <div className="space-y-4">
          {filteredAppeals.map((appeal) => {
            const statusConfig = appealStatusConfig[appeal.status];
            const StatusIcon = statusConfig.icon;
            return (
              <div
                key={appeal._id}
                className="bg-surface rounded-xl border border-border p-5 card-hover"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-text-primary">
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
                    <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {appealTypeLabels[appeal.type]}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {matchNames[appeal.matchId] || appeal.matchId}
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {teamNames[appeal.teamId] || appeal.teamId}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(appeal.submittedAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAppeal(appeal)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
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
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="font-bold text-text-primary text-lg mb-2">暂无申诉</h3>
          <p className="text-text-secondary">
            {searchTerm ? '没有找到匹配的申诉' : '暂无待处理的申诉'}
          </p>
        </div>
      )}

      {selectedAppeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary">申诉详情</h2>
                <button
                  onClick={() => {
                    setSelectedAppeal(null);
                    setDecision('');
                  }}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs text-text-muted mb-1">申诉标题</p>
                <p className="font-bold text-text-primary text-lg">
                  {selectedAppeal.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted mb-1">申诉类型</p>
                  <p className="text-sm text-text-primary">
                    {appealTypeLabels[selectedAppeal.type]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">当前状态</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${appealStatusConfig[selectedAppeal.status].style}`}>
                    {appealStatusConfig[selectedAppeal.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">相关比赛</p>
                  <p className="text-sm text-text-primary">
                    {matchNames[selectedAppeal.matchId] || selectedAppeal.matchId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">申诉球队</p>
                  <p className="text-sm text-text-primary">
                    {teamNames[selectedAppeal.teamId] || selectedAppeal.teamId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">提交时间</p>
                  <p className="text-sm text-text-primary">
                    {new Date(selectedAppeal.submittedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">截止时间</p>
                  <p className="text-sm text-text-primary">
                    {new Date(selectedAppeal.deadline).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-text-muted mb-1">申诉内容</p>
                <div className="bg-surface-hover rounded-lg p-4">
                  <p className="text-sm text-text-primary whitespace-pre-wrap">
                    {selectedAppeal.description}
                  </p>
                </div>
              </div>

              {selectedAppeal.decision && (
                <div>
                  <p className="text-xs text-text-muted mb-1">处理结果</p>
                  <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                    <p className="text-sm text-text-primary">
                      {selectedAppeal.decision}
                    </p>
                    <p className="text-xs text-text-muted mt-2">
                      处理时间：
                      {selectedAppeal.decidedAt &&
                        new Date(selectedAppeal.decidedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              )}

              {(selectedAppeal.status === 'PENDING' ||
                selectedAppeal.status === 'REVIEWING') && (
                <div>
                  <p className="text-xs text-text-muted mb-2">审核决定</p>
                  <textarea
                    rows={3}
                    placeholder="请填写处理决定..."
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none"
                  />
                </div>
              )}
            </div>

            {(selectedAppeal.status === 'PENDING' ||
              selectedAppeal.status === 'REVIEWING') && (
              <div className="p-6 border-t border-border flex gap-3">
                <button
                  onClick={() =>
                    handleUpdateStatus(selectedAppeal._id, 'REVIEWING', decision)
                  }
                  disabled={processingId === selectedAppeal._id}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  标记审核中
                </button>
                <button
                  onClick={() =>
                    handleUpdateStatus(selectedAppeal._id, 'REJECTED', decision)
                  }
                  disabled={processingId === selectedAppeal._id || !decision.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-danger hover:bg-danger/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  驳回申诉
                </button>
                <button
                  onClick={() =>
                    handleUpdateStatus(selectedAppeal._id, 'UPHELD', decision)
                  }
                  disabled={processingId === selectedAppeal._id || !decision.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-success hover:bg-success/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  通过申诉
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
