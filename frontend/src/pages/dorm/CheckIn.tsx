import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Space, Select, DatePicker, Input, Modal, Form,
  message, List, Avatar, Empty,
} from 'antd'
import {
  CheckSquareOutlined, SearchOutlined, DownloadOutlined, QrcodeOutlined,
  UserOutlined, CalendarOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'

const { RangePicker } = DatePicker

export default function CheckIn() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [params, setParams] = useState<any>({})
  const [checkinModal, setCheckinModal] = useState(false)
  const [form] = Form.useForm()

  const fetchList = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/rooms/checkins/', { params: { page, ...params } })
      setList(data.results)
      setTotal(data.count)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [page, params])

  const buildExportUrl = () => {
    const qs = new URLSearchParams(params).toString()
    return `/api/rooms/checkins/export/${qs ? '?' + qs : ''}`
  }

  const doCheckin = async (values: any) => {
    try {
      await axios.post('/api/rooms/checkins/do_checkin/', values)
      message.success('签到成功')
      setCheckinModal(false)
      form.resetFields()
      fetchList()
    } catch {}
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '签到人', dataIndex: 'user_info', width: 140,
      render: (u: any) => (
        <Space>
          <Avatar size="small" src={u?.avatar} icon={!u?.avatar && <UserOutlined />} />
          <span>{u?.real_name || u?.username}</span>
        </Space>
      ),
    },
    {
      title: '签到类型', dataIndex: 'checkin_type', width: 120,
      render: (v: string, r: any) => {
        const colors: Record<string, string> = { seat: 'blue', activity: 'green', duty: 'purple' }
        return <Tag color={colors[v]}>{r.checkin_type_display}</Tag>
      },
    },
    { title: '关联预约', dataIndex: 'reservation', width: 100, render: (v: any) => v ? `#${v}` : '-' },
    { title: '地点', dataIndex: 'location' },
    { title: '备注', dataIndex: 'remark' },
    {
      title: '签到时间', dataIndex: 'created_at', width: 170, fixed: 'right',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="签到类型" allowClear style={{ width: 150 }}
            options={[
              { value: 'seat', label: '座位签到' },
              { value: 'activity', label: '活动签到' },
              { value: 'duty', label: '值班签到' },
            ]}
            onChange={(v) => setParams((p: any) => ({ ...p, checkin_type: v }))}
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
            allowClear placeholder="搜索用户" prefix={<SearchOutlined />} style={{ width: 200 }}
            onPressEnter={(e: any) => setParams((p: any) => ({ ...p, search: e.target.value }))}
          />
          <Space style={{ marginLeft: 'auto' }}>
            <Button type="primary" icon={<CheckSquareOutlined />} onClick={() => setCheckinModal(true)}>
              手动签到
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => window.open(buildExportUrl(), '_blank')}>
              导出签到
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="签到记录">
        <Table
          rowKey="id" loading={loading} dataSource={list} columns={columns} scroll={{ x: 1000 }}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
        />
      </Card>

      <Modal
        title={<Space><QrcodeOutlined />手动签到核销</Space>}
        open={checkinModal}
        onCancel={() => setCheckinModal(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={doCheckin}>
          <Form.Item label="签到类型" name="checkin_type" initialValue="seat" rules={[{ required: true }]}>
            <Select options={[
              { value: 'seat', label: '座位签到' },
              { value: 'activity', label: '活动签到' },
              { value: 'duty', label: '值班签到' },
            ]} />
          </Form.Item>
          <Form.Item label="关联预约ID" name="reservation_id">
            <Input placeholder="选填，座位签到时关联预约" />
          </Form.Item>
          <Form.Item label="签到地点" name="location">
            <Input placeholder="如：1号楼自习室" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
