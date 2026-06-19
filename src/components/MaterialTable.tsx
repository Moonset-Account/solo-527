import { useState } from 'react'
import { Table, Tag, Button, Select } from 'antd'
import type { MaterialItem, MaterialStatus } from '../../shared/types'
import { MATERIAL_STATUS_MAP } from '../../shared/types'

const statusColorMap: Record<string, string> = {
  MISSING: 'red',
  SUBMITTED: 'green',
  SUPPLEMENTING: 'orange',
}

const statusBgMap: Record<string, string> = {
  MISSING: 'bg-red-50',
  SUBMITTED: 'bg-green-50',
  SUPPLEMENTING: 'bg-amber-50',
}

const statusOptions: { value: MaterialStatus; label: string }[] = [
  { value: 'MISSING', label: '缺失' },
  { value: 'SUBMITTED', label: '已提交' },
  { value: 'SUPPLEMENTING', label: '补齐中' },
]

interface MaterialTableProps {
  materials: MaterialItem[]
  onStatusChange: (id: number, status: MaterialStatus) => void
  onBatchRemind: (ids: number[]) => void
}

export default function MaterialTable({ materials, onStatusChange, onBatchRemind }: MaterialTableProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const columns = [
    {
      title: '材料名称',
      dataIndex: 'materialName',
      key: 'materialName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: MaterialStatus) => (
        <Tag color={statusColorMap[status]}>{MATERIAL_STATUS_MAP[status]}</Tag>
      ),
    },
    {
      title: '要求日期',
      dataIndex: 'requiredBy',
      key: 'requiredBy',
      render: (v: string) => new Date(v).toLocaleDateString('zh-CN'),
    },
    {
      title: '提交日期',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (v: string | null) => v ? new Date(v).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '预计日期',
      dataIndex: 'expectedAt',
      key: 'expectedAt',
      render: (v: string | null) => v ? new Date(v).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: MaterialItem) => (
        <Select
          size="small"
          value={record.status}
          options={statusOptions}
          onChange={(val) => onStatusChange(record.id, val)}
          style={{ width: 100 }}
        />
      ),
    },
  ]

  return (
    <div>
      {selectedRowKeys.length > 0 && (
        <div className="mb-3">
          <Button
            type="primary"
            style={{ background: '#F59E0B', borderColor: '#F59E0B', borderRadius: 6 }}
            onClick={() => onBatchRemind(selectedRowKeys as number[])}
          >
            批量催补 ({selectedRowKeys.length})
          </Button>
        </div>
      )}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={materials}
        size="small"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        rowClassName={(record) => statusBgMap[record.status] || ''}
        pagination={false}
      />
    </div>
  )
}
