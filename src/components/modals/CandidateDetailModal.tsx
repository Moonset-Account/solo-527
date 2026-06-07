import { useState } from 'react';
import { X, Calendar, Clock, User, Building2, Briefcase, Radio, MessageSquare, AlertTriangle, Edit2, Check, XCircle, Save } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatDate, formatDays } from '../../utils/format';
import { Candidate, StageRecord } from '../../data/types';

interface CandidateDetailModalProps {
  candidate: Candidate;
  onClose: () => void;
}

function StageTimelineItem({
  stage,
  isLast,
  candidateId,
}: {
  stage: StageRecord;
  isLast: boolean;
  candidateId: string;
}) {
  const { updateStageNote, toggleStageAnomaly } = useStore();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(stage.notes || '');
  const [isAnomalyEditing, setIsAnomalyEditing] = useState(false);
  const [anomalyReason, setAnomalyReason] = useState(stage.anomalyReason || '');

  const handleSaveNote = () => {
    updateStageNote(candidateId, stage.id, noteValue);
    setIsEditingNote(false);
  };

  const handleToggleAnomaly = () => {
    if (stage.isAnomaly) {
      toggleStageAnomaly(candidateId, stage.id, false);
    } else {
      setIsAnomalyEditing(true);
    }
  };

  const handleSaveAnomaly = () => {
    toggleStageAnomaly(candidateId, stage.id, true, anomalyReason || '耗时异常，需要调查');
    setIsAnomalyEditing(false);
  };

  const handleCancelAnomaly = () => {
    setIsAnomalyEditing(false);
    setAnomalyReason(stage.anomalyReason || '');
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
          stage.result === 'pass' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' :
          stage.result === 'fail' ? 'border-red-500 bg-red-50 text-red-600' :
          'border-slate-300 bg-slate-50 text-slate-500'
        }`}>
          {stage.result === 'pass' ? '✓' : stage.result === 'fail' ? '✕' : '…'}
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-200" />}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-800">{stage.stageName}</h4>
              {stage.isAnomaly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                  <AlertTriangle size={12} />
                  异常
                </span>
              )}
              <button
                onClick={handleToggleAnomaly}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                  stage.isAnomaly
                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {stage.isAnomaly ? (
                  <>
                    <XCircle size={12} />
                    取消异常
                  </>
                ) : (
                  <>
                    <AlertTriangle size={12} />
                    标记异常
                  </>
                )}
              </button>
            </div>
            {stage.interviewerName && (
              <p className="mt-1 text-sm text-slate-500">面试官: {stage.interviewerName}</p>
            )}

            {isAnomalyEditing && (
              <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs font-medium text-orange-800 mb-2">异常原因</p>
                <textarea
                  value={anomalyReason}
                  onChange={(e) => setAnomalyReason(e.target.value)}
                  placeholder="请输入异常原因..."
                  className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  rows={2}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={handleCancelAnomaly}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveAnomaly}
                    className="rounded-lg bg-orange-500 px-3 py-1 text-xs text-white hover:bg-orange-600"
                  >
                    <Check size={12} className="inline mr-1" />
                    确认标记
                  </button>
                </div>
              </div>
            )}

            {stage.isAnomaly && stage.anomalyReason && !isAnomalyEditing && (
              <p className="mt-2 text-xs text-orange-600 bg-orange-50 rounded-lg p-2">
                <AlertTriangle size={12} className="inline mr-1" />
                异常原因: {stage.anomalyReason}
              </p>
            )}

            {isEditingNote ? (
              <div className="mt-2">
                <textarea
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  placeholder="添加备注..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  rows={2}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsEditingNote(false);
                      setNoteValue(stage.notes || '');
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="rounded-lg bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
                  >
                    <Save size={12} className="inline mr-1" />
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                {stage.notes ? (
                  <div className="group rounded-lg bg-slate-50 p-2 relative">
                    <p className="text-sm text-slate-600 pr-8">{stage.notes}</p>
                    <button
                      onClick={() => setIsEditingNote(true)}
                      className="absolute right-2 top-2 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-200 group-hover:opacity-100"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingNote(true)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                  >
                    <Edit2 size={12} />
                    添加备注
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="text-right ml-4 shrink-0">
            <p className="text-sm text-slate-600">{formatDate(stage.startDate)}</p>
            {stage.endDate && (
              <p className="text-xs text-slate-400">至 {formatDate(stage.endDate)}</p>
            )}
            {stage.durationDays !== undefined && (
              <p className="mt-1 text-xs font-medium text-blue-600">{formatDays(stage.durationDays)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CandidateDetailModal({ candidate, onClose }: CandidateDetailModalProps) {
  const { stages, feedback } = candidate;
  const hasAnomaly = stages.some(s => s.isAnomaly);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">候选人详情</h2>
            <p className="text-sm text-slate-500">{candidate.name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(85vh-80px)] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">候选人</p>
                <p className="font-medium text-slate-800">{candidate.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Briefcase size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">应聘职位</p>
                <p className="font-medium text-slate-800">{candidate.positionName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Building2 size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">部门</p>
                <p className="font-medium text-slate-800">{candidate.departmentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Radio size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">招聘渠道</p>
                <p className="font-medium text-slate-800">{candidate.channelName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">招聘官</p>
                <p className="font-medium text-slate-800">{candidate.recruiterName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">招聘周期</p>
                <p className="font-medium text-slate-800">
                  {candidate.totalCycleDays ? formatDays(candidate.totalCycleDays) : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">流程时间线</h3>
              {hasAnomaly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">
                  <AlertTriangle size={12} />
                  存在异常流程
                </span>
              )}
            </div>
            <div>
              {stages.map((stage, idx) => (
                <StageTimelineItem
                  key={stage.id}
                  stage={stage}
                  isLast={idx === stages.length - 1}
                  candidateId={candidate.id}
                />
              ))}
            </div>
          </div>

          {feedback && (
            <div className="border-t border-slate-100 px-6 py-4">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-500" />
                <h3 className="font-semibold text-slate-800">候选人反馈</h3>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm text-slate-600">满意度:</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={i < feedback.satisfaction ? 'text-amber-400' : 'text-slate-300'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="ml-2 text-sm font-medium text-slate-700">
                    {feedback.satisfaction}/5
                  </span>
                </div>
                <p className="text-sm text-slate-700">{feedback.comments}</p>
                {feedback.keywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {feedback.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-slate-600"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  <Calendar size={12} className="inline mr-1" />
                  {formatDate(feedback.submitDate)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
