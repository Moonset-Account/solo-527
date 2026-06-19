import { Timeline, Tag } from 'antd'
import type { ReminderRecord } from '../../shared/types'
import { REMIND_TYPE_MAP, REPLY_STATUS_MAP } from '../../shared/types'

const replyColorMap: Record<string, string> = {
  PENDING: 'blue',
  REPLIED: 'green',
  IGNORED: 'red',
}

const remindTypeColorMap: Record<string, string> = {
  SMS: 'blue',
  EMAIL: 'orange',
  SYSTEM: 'purple',
}

interface ReminderTimelineProps {
  reminders: ReminderRecord[]
}

export default function ReminderTimeline({ reminders }: ReminderTimelineProps) {
  if (reminders.length === 0) {
    return <div className="text-slate-400 text-sm py-4 text-center">暂无催办记录</div>
  }

  return (
    <Timeline
      items={reminders.map((r) => ({
        color: replyColorMap[r.replyStatus] || 'gray',
        children: (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Tag color={remindTypeColorMap[r.remindType]}>{REMIND_TYPE_MAP[r.remindType]}</Tag>
              <Tag color={replyColorMap[r.replyStatus]}>{REPLY_STATUS_MAP[r.replyStatus]}</Tag>
            </div>
            <div className="text-slate-700 text-sm">{r.remindContent}</div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>发送给: {r.remindTo}</span>
              <span>{new Date(r.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        ),
      }))}
    />
  )
}
