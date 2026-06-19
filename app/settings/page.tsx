'use client';

import { useState } from 'react';
import {
  Bookmark,
  Plus,
  Trash2,
  Star,
  StarOff,
  Filter,
  Bell,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Card, Button, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const pageKeyMap: Record<string, string> = {
  project_list: '项目列表',
  delay_list: '延期节点列表',
  inspection_list: '巡检任务列表',
  ticket_list: '售后工单列表',
};

export default function SettingsPage() {
  const { savedFilters, addSavedFilter, removeSavedFilter, setDefaultFilter, currentUser } =
    useAppStore();
  const [tab, setTab] = useState<'filters' | 'notifications'>('filters');
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);

  const grouped = savedFilters.reduce<Record<string, typeof savedFilters>>((acc, f) => {
    (acc[f.page_key] ||= []).push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-6">
            <button
              onClick={() => setTab('filters')}
              className={cn(
                'flex items-center gap-1.5 border-b-2 pb-1.5 text-sm font-medium transition-colors',
                tab === 'filters'
                  ? 'border-brand-700 text-brand-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              )}
            >
              <Bookmark className="h-4 w-4" />
              常用筛选条件
            </button>
            <button
              onClick={() => setTab('notifications')}
              className={cn(
                'flex items-center gap-1.5 border-b-2 pb-1.5 text-sm font-medium transition-colors',
                tab === 'notifications'
                  ? 'border-brand-700 text-brand-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              )}
            >
              <Bell className="h-4 w-4" />
              通知偏好
            </button>
          </div>
        }
      >
        {tab === 'filters' && (
          <div className="space-y-6">
            {Object.entries(pageKeyMap).map(([pageKey, pageLabel]) => {
              const list = grouped[pageKey] ?? [];
              return (
                <div key={pageKey} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-zinc-400" />
                      <h4 className="text-sm font-medium text-zinc-800">{pageLabel}</h4>
                      <span className="text-xs text-zinc-400">{list.length} 个已保存</span>
                    </div>
                  </div>
                  {list.length === 0 ? (
                    <div className="rounded border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400">
                      暂无保存的筛选条件，可在各列表页顶部保存常用筛选
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {list.map((f) => (
                        <div
                          key={f.id}
                          className={cn(
                            'group rounded border p-3 transition-colors',
                            f.is_default
                              ? 'border-brand-300 bg-brand-50/40'
                              : 'border-zinc-200 bg-white hover:border-zinc-300'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {f.is_default ? (
                                  <Star className="h-3.5 w-3.5 fill-warn-500 text-warn-500" />
                                ) : (
                                  <StarOff className="h-3.5 w-3.5 text-zinc-300" />
                                )}
                                <span className="truncate text-sm font-medium text-zinc-900">
                                  {f.name}
                                </span>
                              </div>
                              <div className="mt-1.5 text-xs text-zinc-500 line-clamp-2">
                                {Object.entries(f.filter_params)
                                  .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                                  .join(' · ')}
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setDefaultFilter(pageKey, f.id)}
                                className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-warn-600"
                                title={f.is_default ? '取消默认' : '设为默认'}
                              >
                                <Star className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => removeSavedFilter(f.id)}
                                className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-danger-50 hover:text-danger-600"
                                title="删除"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'notifications' && (
          <div className="space-y-4 max-w-xl">
            <div className="text-sm text-zinc-500 mb-3">
              选择接收提醒的渠道，系统将按你设置的规则通过以下渠道推送通知。
            </div>
            {[
              {
                key: 'in_app',
                icon: MessageSquare,
                label: '站内信通知',
                desc: '系统内消息中心与页面右上角铃铛',
                value: notifyInApp,
                set: setNotifyInApp,
              },
              {
                key: 'email',
                icon: Mail,
                label: '邮件通知',
                desc: '发送至登录邮箱 ' + currentUser.email,
                value: notifyEmail,
                set: setNotifyEmail,
              },
              {
                key: 'sms',
                icon: Bell,
                label: '短信通知',
                desc: '发送至手机 ' + currentUser.phone + '（仅高优先级）',
                value: notifySms,
                set: setNotifySms,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-zinc-50 text-zinc-500">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-900">{item.label}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => item.set(!item.value)}
                  className={cn(
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
                    item.value ? 'bg-brand-600' : 'bg-zinc-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                      item.value ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            ))}

            <div className="pt-3">
              <h5 className="text-sm font-medium text-zinc-800 mb-3">我关注的通知类型</h5>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { key: 'delay', label: '节点延期预警', checked: true },
                  { key: 'delay_daily', label: '每日延期汇总', checked: true },
                  { key: 'inspection', label: '巡检到期提醒', checked: true },
                  { key: 'quotation', label: '报价确认请求', checked: true },
                  { key: 'addon', label: '增项待确认', checked: true },
                  { key: 'ticket', label: '售后工单分配', checked: true },
                ].map((t) => (
                  <label
                    key={t.key}
                    className="flex items-center gap-2 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 cursor-pointer hover:bg-zinc-50"
                  >
                    <input type="checkbox" defaultChecked={t.checked} className="h-4 w-4 rounded border-zinc-300 text-brand-700 focus:ring-brand-500" />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
