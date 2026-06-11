import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { auditApi } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Paperclip,
  MessageSquare,
  History,
  Upload,
  X,
  Trash2,
  Plus,
  Clock,
  User,
  ChevronDown,
  ChevronRight,
  FileText,
  Image,
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import type { AuditLog, Attachment, Note } from '@/types';

interface Props {
  entityType: string;
  entityId: number;
  title?: string;
}

export function OperationPanel({ entityType, entityId, title = '操作面板' }: Props) {
  const [activeTab, setActiveTab] = useState<'attachments' | 'notes' | 'history'>('notes');
  const queryClient = useQueryClient();

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="flex border-b border-gray-100">
        {([
          { id: 'notes' as const, label: '备注', icon: MessageSquare },
          { id: 'attachments' as const, label: '附件', icon: Paperclip },
          { id: 'history' as const, label: '修改历史', icon: History },
        ]).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 px-3 py-2.5 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-700 bg-primary-50/50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="p-4 max-h-[420px] overflow-y-auto">
        {activeTab === 'notes' && <NotesPanel entityType={entityType} entityId={entityId} />}
        {activeTab === 'attachments' && <AttachmentsPanel entityType={entityType} entityId={entityId} />}
        {activeTab === 'history' && <HistoryPanel entityType={entityType} entityId={entityId} />}
      </div>
    </div>
  );
}

function NotesPanel({ entityType, entityId }: { entityType: string; entityId: number }) {
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const user = useAuthStore((s: any) => s.user);
  const queryClient = useQueryClient();
  const queryKey = ['notes', entityType, entityId];

  const { data: notes = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => auditApi.notes({ entityType, entityId }),
  });

  const addNote = useMutation({
    mutationFn: (data: any) => auditApi.addNote(data),
    onSuccess: () => {
      toast.success('备注添加成功');
      setContent('');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '添加失败'),
  });

  const deleteNote = useMutation({
    mutationFn: (id: number) => auditApi.deleteNote(id),
    onSuccess: () => {
      toast.success('删除成功');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '删除失败'),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="添加备注..."
          className="input min-h-[80px] resize-none"
        />
        <div className="flex items-center justify-between">
          {user?.role !== 'audience' && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={e => setIsPrivate(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              仅内部可见
            </label>
          )}
          <button
            onClick={() => addNote.mutate({ entityType, entityId, content, isPrivate })}
            disabled={!content.trim() || addNote.isPending}
            className="btn-primary text-sm"
          >
            <Plus className="w-4 h-4" /> 添加备注
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && <div className="text-sm text-gray-500 text-center py-4">加载中...</div>}
        {!isLoading && notes.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-8">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            暂无备注
          </div>
        )}
        {notes.map((note: Note) => (
          <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                  {(note.createdByName || 'U')[0]}
                </div>
                <span className="font-medium text-gray-800">{note.createdByName}</span>
                {note.isPrivate && (
                  <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[10px] font-medium">内部</span>
                )}
              </div>
              {(note.createdBy === user?.id || user?.role !== 'audience') && (
                <button
                  onClick={() => deleteNote.mutate(note.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
            <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDateTime(note.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttachmentsPanel({ entityType, entityId }: { entityType: string; entityId: number }) {
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const queryClient = useQueryClient();
  const queryKey = ['attachments', entityType, entityId];
  const user = useAuthStore((s: any) => s.user);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => auditApi.attachments({ entityType, entityId }),
  });

  const addAttachment = useMutation({
    mutationFn: (data: any) => auditApi.addAttachment(data),
    onSuccess: () => {
      toast.success('附件添加成功');
      setFileName('');
      setFileUrl('');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '添加失败'),
  });

  const delAttachment = useMutation({
    mutationFn: (id: number) => auditApi.deleteAttachment(id),
    onSuccess: () => {
      toast.success('删除成功');
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleSubmit = () => {
    if (!fileName.trim() || !fileUrl.trim()) {
      toast.warning('请填写文件名和URL');
      return;
    }
    addAttachment.mutate({
      entityType,
      entityId,
      fileName,
      originalName: fileName,
      fileType: fileName.split('.').pop() || 'unknown',
      fileUrl,
    });
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);

  return (
    <div className="space-y-4">
      <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-xs font-medium text-gray-600">添加附件链接</p>
        <input
          type="text"
          placeholder="文件名（如：身份证正面.jpg）"
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          className="input text-sm"
        />
        <input
          type="text"
          placeholder="文件URL（https://...）"
          value={fileUrl}
          onChange={e => setFileUrl(e.target.value)}
          className="input text-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={addAttachment.isPending}
          className="btn-primary text-sm w-full"
        >
          <Upload className="w-4 h-4" /> 添加附件
        </button>
      </div>

      <div className="space-y-2">
        {isLoading && <div className="text-sm text-gray-500 text-center py-4">加载中...</div>}
        {!isLoading && attachments.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-8">
            <Paperclip className="w-10 h-10 mx-auto mb-2 opacity-50" />
            暂无附件
          </div>
        )}
        {attachments.map((att: Attachment) => (
          <div key={att.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
              isImage(att.originalName) ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            )}>
              {isImage(att.originalName) ? <Image className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <a href={att.fileUrl} target="_blank" rel="noreferrer"
                className="text-sm font-medium text-gray-800 hover:text-primary-600 truncate block">
                {att.originalName}
              </a>
              <p className="text-xs text-gray-400">
                {att.uploadedByName} · {formatDateTime(att.createdAt)}
                {att.fileSize ? ` · ${(att.fileSize / 1024).toFixed(1)}KB` : ''}
              </p>
            </div>
            {(att.uploadedBy === user?.id || user?.role !== 'audience') && (
              <button
                onClick={() => delAttachment.mutate(att.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ entityType, entityId }: { entityType: string; entityId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', entityType, entityId],
    queryFn: () => auditApi.logs({ entityType, entityId, pageSize: 100 }),
  });

  const formatValue = (v: any) => {
    if (v === null || v === undefined) return '-';
    if (typeof v === 'object') return JSON.stringify(v, null, 2);
    return String(v);
  };

  return (
    <div className="space-y-0">
      {isLoading && <div className="text-sm text-gray-500 text-center py-4">加载中...</div>}
      {!isLoading && (!data || data.list?.length === 0) && (
        <div className="text-sm text-gray-400 text-center py-8">
          <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
          暂无操作记录
        </div>
      )}
      <div className="relative">
        <div className="absolute left-[14px] top-2 bottom-2 w-px bg-gray-200" />
        {(data?.list || []).map((log: AuditLog) => (
          <div key={log.id} className="relative pl-10 pb-4 last:pb-0">
            <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center">
              <Clock className="w-3 h-3 text-primary-700" />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-800">
                  {log.changedByName || '系统'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                  {log.action}
                </span>
                <span className="text-xs text-gray-400 ml-auto">{formatDateTime(log.createdAt)}</span>
              </div>
              {log.changeNote && (
                <p className="text-sm text-gray-700 mb-2">{log.changeNote}</p>
              )}
              {log.oldValue || log.newValue ? (
                <details className="group">
                  <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 select-none flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                    查看变更详情
                  </summary>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {log.oldValue && (
                      <div className="p-2 rounded bg-red-50 border border-red-100">
                        <p className="font-medium text-red-700 mb-1">变更前</p>
                        <pre className="whitespace-pre-wrap text-red-600 break-all">{formatValue(log.oldValue)}</pre>
                      </div>
                    )}
                    {log.newValue && (
                      <div className="p-2 rounded bg-green-50 border border-green-100">
                        <p className="font-medium text-green-700 mb-1">变更后</p>
                        <pre className="whitespace-pre-wrap text-green-600 break-all">{formatValue(log.newValue)}</pre>
                      </div>
                    )}
                  </div>
                </details>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
