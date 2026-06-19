import { useEffect } from 'react'
import { Card, Table, Row, Col } from 'antd'
import { useStatisticsStore } from '@/stores/statisticsStore'

function ProgressRing({ rate }: { rate: number }) {
  return (
    <div className="flex justify-center py-4">
      <div className="progress-ring" style={{ '--progress': rate } as React.CSSProperties}>
        <svg viewBox="0 0 160 160" width="160" height="160">
          <circle cx="80" cy="80" r="65" fill="none" stroke="#E2E8F0" strokeWidth="12" />
          <circle
            cx="80" cy="80" r="65" fill="none"
            stroke="#10B981" strokeWidth="12"
            strokeDasharray={`${rate * 4.08} ${408 - rate * 4.08}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
          <text x="80" y="80" textAnchor="middle" dominantBaseline="central" fontSize="32" fontWeight="600" fill="#1E293B">
            {rate}%
          </text>
        </svg>
      </div>
    </div>
  )
}

function SimpleBarChart({ data }: { data: { name: string; avg: number; p90: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.p90), 1)
  return (
    <div className="space-y-3 py-2">
      {data.map((item) => (
        <div key={item.name}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-700">{item.name}</span>
            <span className="text-slate-500">均值{item.avg}min / P90 {item.p90}min</span>
          </div>
          <div className="flex gap-1">
            <div
              className="h-5 rounded-sm"
              style={{ width: `${(item.avg / maxVal) * 100}%`, background: '#F59E0B', minWidth: 4 }}
            />
            <div
              className="h-5 rounded-sm"
              style={{ width: `${(item.p90 / maxVal) * 100}%`, background: '#1E293B', minWidth: 4, opacity: 0.3 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Statistics() {
  const { completeness, duration, reminders, timeoutRank, fetchAll } = useStatisticsStore()

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const durationChartData = duration.map((d) => ({
    name: d.nodeName,
    avg: d.avgMinutes,
    p90: d.p90Minutes,
  }))

  const reminderColumns = [
    { title: '处理人', dataIndex: 'assignee', key: 'assignee' },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '催办次数', dataIndex: 'count', key: 'count', sorter: (a: { count: number }, b: { count: number }) => a.count - b.count, defaultSortOrder: 'descend' as const },
  ]

  const timeoutColumns = [
    { title: '节点名称', dataIndex: 'nodeName', key: 'nodeName' },
    { title: '超时次数', dataIndex: 'timeoutCount', key: 'timeoutCount', sorter: (a: { timeoutCount: number }, b: { timeoutCount: number }) => a.timeoutCount - b.timeoutCount, defaultSortOrder: 'descend' as const },
    { title: '平均超时(分钟)', dataIndex: 'avgOverdueMinutes', key: 'avgOverdueMinutes' },
  ]

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="材料完整率" className="shadow-sm" style={{ borderRadius: 8 }}>
            <ProgressRing rate={completeness?.rate ?? 0} />
            <div className="flex justify-around text-center text-sm text-slate-500 mt-2">
              <div>总数 <span className="font-medium text-slate-700">{completeness?.total ?? 0}</span></div>
              <div>已提交 <span className="font-medium text-emerald-600">{completeness?.submitted ?? 0}</span></div>
              <div>缺失 <span className="font-medium text-red-500">{completeness?.missing ?? 0}</span></div>
              <div>补齐中 <span className="font-medium text-amber-500">{completeness?.supplementing ?? 0}</span></div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="流程耗时分析" className="shadow-sm" style={{ borderRadius: 8 }}>
            {durationChartData.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-8">暂无数据</div>
            ) : (
              <SimpleBarChart data={durationChartData} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col span={12}>
          <Card title="催办频次统计" className="shadow-sm" style={{ borderRadius: 8 }}>
            <Table
              rowKey="assignee"
              columns={reminderColumns}
              dataSource={reminders}
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="节点超时排行" className="shadow-sm" style={{ borderRadius: 8 }}>
            <Table
              rowKey="nodeName"
              columns={timeoutColumns}
              dataSource={timeoutRank}
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
