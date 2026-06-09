import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users2,
  Hash,
  Clock,
  ShieldCheck,
  ShieldAlert,
  FileText,
  ListTodo,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { getMeetingDetail, mockActionItems, mockSpeakers } from '@/lib/mockData';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { cn } from '@/lib/utils';
import type { ActionItem, TranscriptSegment } from '#shared/types';

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meeting = useMemo(() => getMeetingDetail(id || ''), [id]);
  const [highlightedSegments, setHighlightedSegments] = useState<string[]>([]);
  const [selectedActionItem, setSelectedActionItem] = useState<string | null>(null);

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-700">会议不存在</h2>
        <Link to="/meetings" className="mt-4 text-primary-600 hover:underline">
          返回会议列表
        </Link>
      </div>
    );
  }

  const meetingActionItems: ActionItem[] = mockActionItems.filter(
    (ai) => ai.meetingId === meeting.id
  );

  const speakersMap = Object.fromEntries(mockSpeakers.map((s) => [s.id, s]));

  const handleJumpToEvidence = (segmentId: string) => {
    setHighlightedSegments((prev) =>
      prev.includes(segmentId) ? prev.filter((s) => s !== segmentId) : [...prev, segmentId]
    );
    const el = document.getElementById(`segment-${segmentId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center shadow-sm transition-all"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{meeting.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {meeting.date}
            </span>
            <span className="flex items-center gap-1">
              <Users2 className="h-3.5 w-3.5" />
              {meeting.speakers.length} 位参与人
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {meeting.transcript.length} 段转写
            </span>
            <span className="flex items-center gap-1">
              <ListTodo className="h-3.5 w-3.5" />
              {meetingActionItems.length} 条行动项
            </span>
            {meeting.maskingApplied ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                <ShieldCheck className="h-3 w-3" />
                已脱敏
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                <ShieldAlert className="h-3 w-3" />
                未脱敏
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-primary-50 via-white to-accent-50 border border-slate-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-xs font-medium text-slate-500">议题</div>
            <div className="flex flex-wrap gap-1.5">
              {meeting.topics.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-slate-700 text-xs font-medium border border-slate-200 shadow-sm"
                >
                  <Hash className="h-3 w-3 text-primary-500" />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">参与人：</span>
            <div className="flex -space-x-2">
              {meeting.speakers.map((sp) => (
                <div
                  key={sp.id}
                  title={`${sp.name} · ${sp.role || ''}`}
                  className="h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center text-white text-[11px] font-semibold"
                  style={{ backgroundColor: sp.color }}
                >
                  {sp.name.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">会议转写</h2>
                <p className="text-xs text-slate-500">点击证据链可高亮对应段落</p>
              </div>
            </div>
            {highlightedSegments.length > 0 && (
              <button
                onClick={() => setHighlightedSegments([])}
                className="text-xs text-slate-500 hover:text-primary-600"
              >
                清除高亮 ({highlightedSegments.length})
              </button>
            )}
          </div>
          <div className="p-5 space-y-4 max-h-[700px] overflow-y-auto">
            {meeting.transcript.map((seg: TranscriptSegment) => {
              const sp = speakersMap[seg.speakerId] || { name: '未知', color: '#64748b' };
              const isHighlighted = highlightedSegments.includes(seg.id);
              const hasEvidence = meetingActionItems.some((ai) =>
                ai.evidence.some((e) => e.segmentId === seg.id)
              );
              return (
                <div
                  key={seg.id}
                  id={`segment-${seg.id}`}
                  className={cn(
                    'flex gap-4 p-3 rounded-xl transition-all',
                    isHighlighted
                      ? 'bg-yellow-100/70 ring-2 ring-yellow-400 shadow-md scale-[1.01]'
                      : hasEvidence
                      ? 'bg-yellow-50/60 hover:bg-yellow-50'
                      : 'hover:bg-slate-50'
                  )}
                >
                  <div className="flex flex-col items-center gap-2 pt-0.5">
                    <div
                      className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                      style={{ backgroundColor: sp.color }}
                    >
                      {sp.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{sp.name}</span>
                      {'role' in sp && sp.role && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {sp.role}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {seg.startTime} - {seg.endTime}
                      </span>
                      {hasEvidence && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-yellow-200/60 text-yellow-800 text-[10px] font-medium">
                          <Sparkles className="h-3 w-3" />
                          证据段
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {seg.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/40">
              <div className="h-9 w-9 rounded-xl bg-accent-50 flex items-center justify-center text-accent-700">
                <ListTodo className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">提取的行动项</h2>
                <p className="text-xs text-slate-500">共 {meetingActionItems.length} 条</p>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[680px] overflow-y-auto">
              {meetingActionItems.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  暂无行动项
                </div>
              )}
              {meetingActionItems.map((ai) => {
                const minConf = ai.fieldConfidences.reduce(
                  (m, f) => Math.min(m, f.confidence),
                  1
                );
                const minLevel =
                  minConf >= 0.85 ? 'high' : minConf >= 0.65 ? 'medium' : minConf >= 0.4 ? 'low' : 'unknown';
                const assignee = ai.assignee
                  ? mockSpeakers.find((s) => s.id === ai.assignee)?.name ||
                    [{ id: '1', name: '管理员' }, { id: '4', name: '张三' }, { id: '5', name: '赵六' }].find(
                      (u) => u.id === ai.assignee
                    )?.name ||
                    ai.assignee
                  : null;
                return (
                  <div
                    key={ai.id}
                    onClick={() => {
                      setSelectedActionItem(ai.id);
                      navigate(`/workbench?highlight=${ai.id}`);
                    }}
                    className={cn(
                      'group p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md',
                      selectedActionItem === ai.id
                        ? 'border-primary-300 bg-primary-50/40 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50/60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-primary-700 transition-colors">
                          {ai.content}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          {ai.topic && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              <Hash className="h-3 w-3 mr-0.5" />
                              {ai.topic}
                            </span>
                          )}
                          {assignee && (
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-md',
                                ai.assigneeStatus === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : ai.assigneeStatus === 'pending_assignment'
                                  ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-300 ring-offset-1'
                                  : 'bg-blue-100 text-blue-700 ring-2 ring-blue-300 ring-offset-1'
                              )}
                            >
                              <Users2 className="h-3 w-3 mr-0.5" />
                              {assignee}
                            </span>
                          )}
                          {!assignee && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 ring-2 ring-rose-300 ring-offset-1">
                              未分配
                            </span>
                          )}
                          {ai.dueDate && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              <Calendar className="h-3 w-3 mr-0.5" />
                              {ai.dueDate}
                            </span>
                          )}
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md font-semibold',
                              ai.priority === 'P0' && 'bg-rose-100 text-rose-700',
                              ai.priority === 'P1' && 'bg-orange-100 text-orange-700',
                              ai.priority === 'P2' && 'bg-amber-100 text-amber-700',
                              ai.priority === 'P3' && 'bg-slate-100 text-slate-700'
                            )}
                          >
                            {ai.priority}
                          </span>
                        </div>
                        {ai.evidence.length > 0 && (
                          <div className="mt-2.5">
                            <div className="text-[11px] text-slate-400 mb-1">证据链：</div>
                            <div className="flex flex-wrap gap-1.5">
                              {ai.evidence.map((ev, idx) => (
                                <button
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleJumpToEvidence(ev.segmentId);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 text-[11px] font-medium hover:bg-yellow-200 transition-colors"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  证据#{idx + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                        <ConfidenceBadge
                          level={minLevel as 'high' | 'medium' | 'low' | 'unknown'}
                          value={minConf}
                        />
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
