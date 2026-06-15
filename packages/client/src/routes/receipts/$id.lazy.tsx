import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

export const Route = createLazyFileRoute('/receipts/$id')({
  component: ReceiptDetail,
});

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

interface RevisionHistory {
  id: string;
  fieldName: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  createdAt: string;
}

interface Receipt {
  id: string;
  receiptNo: string;
  receiptType: string;
  amount: number;
  status: string;
  pet: {
    id: string;
    name: string;
  };
  fosteringRecord: any;
  attachments: Attachment[];
  notes: Note[];
  revisionHistory: RevisionHistory[];
  createdAt: string;
}

function ReceiptDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    loadReceipt();
  }, [id]);

  const loadReceipt = async () => {
    try {
      const { data } = await apiClient.get(`/receipts/${id}`);
      setReceipt(data);
    } catch (error) {
      console.error('Failed to load receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      await apiClient.post(`/receipts/${id}/notes`, {
        receiptId: id,
        content: newNote,
        createdBy: '系统管理员',
      });
      setNewNote('');
      loadReceipt();
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  if (!receipt) {
    return <div className="text-center py-12">单据不存在</div>;
  }

  const tabs = [
    { key: 'basic', label: '基本信息' },
    { key: 'attachments', label: `附件 (${receipt.attachments?.length || 0})` },
    { key: 'notes', label: `备注 (${receipt.notes?.length || 0})` },
    { key: 'history', label: `修改历史 (${receipt.revisionHistory?.length || 0})` },
  ];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      draft: '草稿',
      pending: '待处理',
      paid: '已完成',
      cancelled: '已取消',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || colors.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) return '🖼️';
    if (fileType?.startsWith('application/pdf')) return '📄';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: '/receipts' })}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-800">单据详情</h1>
          <span className="text-lg text-gray-500">{receipt.receiptNo}</span>
          {getStatusBadge(receipt.status)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">基本信息</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">单据编号</span>
                    <span className="font-medium">{receipt.receiptNo}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">单据类型</span>
                    <span>
                      {receipt.receiptType === 'fostering'
                        ? '寄养费'
                        : receipt.receiptType === 'medical'
                        ? '医疗费'
                        : receipt.receiptType === 'grooming'
                        ? '洗护费'
                        : '其他'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">金额</span>
                    <span className="font-medium text-lg text-green-600">
                      {receipt.amount ? `¥${(receipt.amount / 100).toFixed(2)}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">状态</span>
                    <span>{getStatusBadge(receipt.status)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">创建时间</span>
                    <span>{new Date(receipt.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">关联信息</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">关联宠物</span>
                    <span className="text-blue-600">{receipt.pet?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">寄养记录</span>
                    <span>{receipt.fosteringRecord?.id || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">附件列表</h3>
                <button className="text-blue-600 hover:text-blue-800 text-sm">+ 上传附件</button>
              </div>
              {receipt.attachments?.length > 0 ? (
                <div className="space-y-3">
                  {receipt.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(att.fileType)}</span>
                        <div>
                          <div className="font-medium">{att.fileName}</div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(att.fileSize)} · 上传于{' '}
                            {new Date(att.createdAt).toLocaleDateString()} · {att.uploadedBy || '未知'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          下载
                        </a>
                        <button className="text-red-600 hover:text-red-800 text-sm">删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">暂无附件</p>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">备注</h3>
              <div className="mb-6">
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="添加备注..."
                  className="w-full border rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <button
                    onClick={addNote}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    添加备注
                  </button>
                </div>
              </div>
              {receipt.notes?.length > 0 ? (
                <div className="space-y-4">
                  {receipt.notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-sm">{note.createdBy || '匿名'}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">暂无备注</p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">修改历史</h3>
              {receipt.revisionHistory?.length > 0 ? (
                <div className="space-y-4">
                  {receipt.revisionHistory.map((history) => (
                    <div key={history.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-sm">{history.changedBy || '系统'}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(history.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">修改字段: </span>
                        <span className="font-medium">{history.fieldName}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-red-500">旧值:</span>{' '}
                          <span className="font-mono">
                            {JSON.stringify(history.oldValue)}
                          </span>
                        </div>
                        <div>
                          <span className="text-green-500">新值:</span>{' '}
                          <span className="font-mono">
                            {JSON.stringify(history.newValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">暂无修改历史</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
