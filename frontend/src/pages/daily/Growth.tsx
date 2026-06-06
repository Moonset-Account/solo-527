import { Card, Table, Input, Select, Button, Space, DatePicker, Avatar, Modal, Form, InputNumber, message } from 'antd'
import { SearchOutlined, PlusOutlined, UserOutlined, LineChartOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import dayjs from 'dayjs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { GrowthRecord } from '@/types'

const GrowthRecords = () => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = React.useState({
    search: '',
    child: undefined as number | undefined
  })
  const [chartVisible, setChartVisible] = React.useState(false)
  const [selectedChild, setSelectedChild] = React.useState<number | null>(null)
  const [modalVisible, setModalVisible] = React.useState(false)
  const [form] = Form.useForm()

  const { data: children } = useQuery(
    ['children-growth'],
    () => axios.get('/api/children/children/', { params: { status: 'active' } }).then((res) => res.data.results)
  )

  const { data, isLoading } = useQuery(
    ['growth-records', filters],
    () => {
      const params: any = { ordering: '-record_date' }
      if (filters.search) params.search = filters.search
      if (filters.child) params.child = filters.child
      return axios.get('/api/daily-records/growth/', { params }).then((res) => res.data.results)
    }
  )

  const { data: chartData } = useQuery(
    ['growth-chart', selectedChild],
    () => axios.get('/api/daily-records/growth/', {
      params: { child: selectedChild, ordering: 'record_date' }
    }).then((res) => res.data.results),
    { enabled: !!selectedChild }
  )

  const createMutation = useMutation(
    (data: any) => axios.post('/api/daily-records/growth/', data),
    {
      onSuccess: () => {
        message.success('添加成功')
        queryClient.invalidateQueries(['growth-records'])
        setModalVisible(false)
        form.resetFields()
      }
    }
  )

  const columns = [
    {
      title: '儿童',
      dataIndex: 'child_name',
      render: (v: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {v}
        </Space>
      )
    },
    { title: '记录日期', dataIndex: 'record_date' },
    { title: '身高(cm)', dataIndex: 'height', render: (v: number) => v || '-' },
    { title: '体重(kg)', dataIndex: 'weight', render: (v: number) => v || '-' },
    { title: '头围(cm)', dataIndex: 'head_circumference', render: (v: number) => v || '-' },
    { title: 'BMI', dataIndex: 'bmi', render: (v: number) => v || '-' },
    { title: '记录人', dataIndex: 'teacher_name' },
    {
      title: '操作',
      width: 120,
      render: (_, record: GrowthRecord) => (
        <Button
          type="link"
          icon={<LineChartOutlined />}
          onClick={() => {
            setSelectedChild(record.child)
            setChartVisible(true)
          }}
        >
          趋势
        </Button>
      )
    }
  ]

  const handleCreate = () => {
    form.validateFields().then((values) => {
      const data = {
        child: values.child,
        record_date: values.record_date.format('YYYY-MM-DD'),
        height: values.height,
        weight: values.weight,
        head_circumference: values.head_circumference,
        notes: values.notes
      }
      createMutation.mutate(data)
    })
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">成长记录</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          添加记录
        </Button>
      </div>

      <Card className="filter-bar" bordered={false}>
        <Space wrap>
          <Input
            placeholder="搜索儿童姓名"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="选择儿童"
            style={{ width: 200 }}
            allowClear
            value={filters.child}
            onChange={(v) => setFilters({ ...filters, child: v })}
            showSearch
            optionFilterProp="children"
          >
            {children?.map((c: any) => (
              <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Card className="table-container" bordered={false}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title="添加成长记录"
        open={modalVisible}
        onOk={handleCreate}
        onCancel={() => setModalVisible(false)}
        confirmLoading={createMutation.isLoading}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="选择儿童" name="child" rules={[{ required: true }]}>
            <Select showSearch placeholder="选择儿童">
              {children?.map((c: any) => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="记录日期" name="record_date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Space wrap>
            <Form.Item label="身高(cm)" name="height">
              <InputNumber min={0} max={200} step={0.1} />
            </Form.Item>
            <Form.Item label="体重(kg)" name="weight">
              <InputNumber min={0} max={100} step={0.01} />
            </Form.Item>
            <Form.Item label="头围(cm)" name="head_circumference">
              <InputNumber min={0} max={100} step={0.1} />
            </Form.Item>
          </Space>
          <Form.Item label="备注" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="成长趋势图"
        open={chartVisible}
        onCancel={() => setChartVisible(false)}
        footer={null}
        width={700}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="record_date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="height" name="身高(cm)" stroke="#1890ff" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="weight" name="体重(kg)" stroke="#52c41a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Modal>
    </div>
  )
}

export default GrowthRecords
