import { useEffect, useState } from 'react';
import { Bell, BellOff, Send } from 'lucide-react';
import { useMessageStore } from '@/stores/messageStore';
import type { MessageType } from '../../shared/types';

const typeTabs: { key: string; label: string }[] = [
  { key: '', label: '全部' },
  { key: 'system', label: '系统' },
  { key: 'reminder', label: '提醒' },
  { key: 'approval', label: '审批' },
  { key: 'notification', label: '通知' },
];

export default function Messages() {
  const { messages, unreadCount, loading, fetchMessages, markRead, fetchUnreadCount } = useMessageStore();
  const [activeType, setActiveType] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [fetchMessages, fetchUnreadCount]);

  const filtered = activeType ? messages.filter((m) => m.type === activeType) : messages;
  const selected = messages.find((m) => m.id === selectedId);

  const handleClick = async (id: number) => {
    setSelectedId(id);
    const msg = messages.find((m) => m.id === id);
    if (msg && !msg.read) {
      await markRead(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
      <div className="lg:col-span-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-gray-800">消息中心</h3>
            {unreadCount > 0 && (
              <span className="bg-danger text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1 mb-3 flex-wrap">
          {typeTabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveType(tab.key)}
              className={`px-2.5 py-1 text-xs rounded-btn transition-colors ${activeType === tab.key ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-12">暂无消息</div>
          ) : (
            filtered.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleClick(msg.id)}
                className={`p-3 rounded-btn cursor-pointer transition-colors ${
                  selectedId === msg.id ? 'bg-accent/10 border border-accent/30' : 'hover:bg-gray-50 border border-transparent'
                } ${!msg.read ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {!msg.read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />}
                  <span className={`text-sm font-medium ${!msg.read ? 'text-gray-800' : 'text-gray-600'}`}>{msg.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    msg.type === 'system' ? 'bg-blue-100 text-blue-600' :
                    msg.type === 'reminder' ? 'bg-amber-100 text-amber-600' :
                    msg.type === 'approval' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {msg.type === 'system' ? '系统' : msg.type === 'reminder' ? '提醒' : msg.type === 'approval' ? '审批' : '通知'}
                  </span>
                  <span>{msg.created_at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-2 card flex flex-col">
        {selected ? (
          <>
            <div className="border-b border-gray-100 pb-3 mb-3">
              <h3 className="text-lg font-semibold text-gray-800">{selected.title}</h3>
              <div className="text-xs text-gray-400 mt-1">{selected.created_at?.replace('T', ' ').slice(0, 19)}</div>
            </div>
            <div className="flex-1 text-sm text-gray-600 whitespace-pre-wrap">{selected.content}</div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BellOff className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>选择一条消息查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
