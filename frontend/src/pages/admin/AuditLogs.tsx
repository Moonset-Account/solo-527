import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Space, Select, DatePicker, Input, Button,
} from 'antd'
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'

const { RangePicker } = DatePicker

const operationColors: Record<string, string> = {
  create: 'green', update: 'blue', delete: 'red', login: 'purple',
  logout: 'default', export: 'cyan', approve: 'green', reject: 'red',
  notify: 'orange', assign: 'blue', complete: 'green',
}

export default function AuditLogs() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [params, setParams] = useState<any>({})

  const fetchList = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/audit/logs/', { params: { page, ...params } })
      setList(data.results)
      setTotal(data.count)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [page, params])

  const buildExportUrl = () => {
    const qs = new URLSearchParams(params).toString()
    return `/api/audit/logs/export/${qs ? '?' + qs : ''}`
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '用户名', dataIndex: 'username', width: 140 },
    {
      title: '操作类型', dataIndex: 'operation', width: 120,
      render: (v: string, r: any) => <Tag color={operationColors[v] || 'default'}>{r.operation_display}</Tag>,
    },
    { title: '模块', dataIndex: 'module', width: 120 },
    { title: '描述', dataIndex: 'description' },
    { title: 'IP地址', dataIndex: 'ip_address', width: 140 },
    {
      title: '操作时间', dataIndex: 'created_at', width: 170, fixed: 'right',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="操作类型" allowClear style={{ width: 160 }}
            options={[
              { value: 'create', label: '创建' },
              { value: 'update', label: '更新' },
              { value: 'delete', label: '删除' },
              { value: 'login', label: '登录' },
              { value: 'export', label: '导出' },
              { value: 'approve', label: '审核通过' },
              { value: 'assign', label: '分配任务' },
              { value: 'complete', label: '完成任务' },
              { value: 'notify', label: '发送通知' },
            ]}
            onChange={(v) => setParams((p: any) => ({ ...p, operation: v }))}
          />
          <Select
            placeholder="模块" allowClear style={{ width: 160 }}
            options={[
              { value: '用户管理', label: '用户管理' },
              { value: '报修管理', label: '报修管理' },
              { value: '消息通知', label: '消息通知' },
              { value: '自习室管理', label: '自习室管理' },
              { value: '审计日志', label: '审计日志' },
              { value: '认证', label: '认证' },
            ]}
            onChange={(v) => setParams((p: any) => ({ ...p, module: v }))}
          />
          <RangePicker
            showTime
            onChange={(dates: any) => setParams((p: any) => ({
              ...p,
              created_from: dates?.[0]?.format('YYYY-MM-DD'),
              created_to: dates?.[1]?.format('YYYY-MM-DD'),
            }))}
          />
          <Input
            allowClear placeholder="搜索" prefix={<SearchOutlined />} style={{ width: 200 }}
            onPressEnter={(e: any) => setParams((p: any) => ({ ...p, search: e.target.value }))}
          />
          <Button icon={<DownloadOutlined />} onClick={() => window.open(buildExportUrl(), '_blank')}>
            导出日志
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id" loading={loading} dataSource={list} columns={columns} scroll={{ x: 1100 }}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
        />
      </Card>
    </div>
  )
}
