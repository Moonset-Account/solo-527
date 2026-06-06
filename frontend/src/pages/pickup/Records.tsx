import { Card, Table, Tag, Input, Select, DatePicker, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from 'react-query'
import { pickupApi } from '@/services/pickup'
import dayjs from 'dayjs'
import type { PickupRecord } from '@/types'

const PickupRecords = () => {
  const [filters, setFilters] = React.useState({
    search: '',
    status: undefined as string | undefined,
    pickup_type: undefined as string | undefined,
    date: null as dayjs.Dayjs | null
  })

  const { data, isLoading } = useQuery(
    ['pickup-records', filters],
    () => {
      const params: any = {
        ordering: '-pickup_time'
      }
      if (filters.status) params.status = filters.status
      if (filters.pickup_type) params.pickup_type = filters.pickup_type
      if (filters.date) params.pickup_time = filters.date.format('YYYY-MM-DD')
      if (filters.search) params.search = filters.search
      return pickupApi.getRecords(params).then((res) => res.data.results)
    }
  )

  const statusColor: Record<string, string> = {
    pending: 'orange',
    verified: 'green',
    rejected: 'red',
    cancelled: 'default'
  }

  const columns = [
    { title: '儿童姓名', dataIndex: 'child_name' },
    {
      title: '类型',
      dataIndex: 'pickup_type',
      render: (v: string) => v === 'dropoff' ? <Tag color="blue">入园</Tag> : <Tag color="orange">离园</Tag>
    },
    { title: '接送人', dataIndex: 'pickup_person_name' },
    { title: '关系', dataIndex: 'pickup_person_relation' },
    { title: '联系电话', dataIndex: 'pickup_person_phone' },
    { title: '体温', dataIndex: 'temperature', render: (v: number) => v ? `${v}℃` : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string, record: PickupRecord) => <Tag color={statusColor[v]}>{record.status_display}</Tag>
    },
    { title: '核验人', dataIndex: 'verified_by_name' },
    {
      title: '接送时间',
      dataIndex: 'pickup_time',
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">接送记录</h2>
      </div>

      <Card className="filter-bar" bordered={false}>
        <Space wrap>
          <Input
            placeholder="搜索儿童姓名、接送人"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="接送类型"
            style={{ width: 120 }}
            allowClear
            value={filters.pickup_type}
            onChange={(v) => setFilters({ ...filters, pickup_type: v })}
          >
            <Select.Option value="dropoff">入园</Select.Option>
            <Select.Option value="pickup">离园</Select.Option>
          </Select>
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
          >
            <Select.Option value="pending">待核验</Select.Option>
            <Select.Option value="verified">已核验</Select.Option>
            <Select.Option value="rejected">已拒绝</Select.Option>
          </Select>
          <DatePicker
            placeholder="选择日期"
            value={filters.date}
            onChange={(d) => setFilters({ ...filters, date: d })}
            allowClear
          />
        </Space>
      </Card>

      <Card className="table-container" bordered={false}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />
      </Card>
    </div>
  )
}

export default PickupRecords
