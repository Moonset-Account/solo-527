import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, message, Tag } from 'antd'
import { PlusOutlined, StopOutlined } from '@ant-design/icons'
import { freezeApi, memberApi } from '@/api'
import type { MemberFreeze, Member } from '@/types'
import dayjs from 'dayjs'

const FreezeList: React.FC = () => {
  const [freezes, setFreezes] = useState<MemberFreeze[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [freezeData, memberData] = await Promise.all([
        freezeApi.list(),
        memberApi.list()
      ])
      setFreezes(freezeData)
      setMembers(memberData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    form.resetFields()
    setModalOpen(true)
  }

  const handleCancel = async (id: number) => {
    try {
      await freezeApi.cancel(id)
      message.success('取消成功')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const startDate = values.startDate ? values.startDate.format('YYYY-MM-DD') : null
      const endDate = values.endDate ? values.endDate.format('YYYY-MM-DD') : null
      const freezeDays = startDate && endDate ? dayjs(endDate).diff(dayjs(startDate), 'day') + 1 : 0
      
      const data = {
        ...values,
        startDate,
        endDate,
        freezeDays
      }
      await freezeApi.create(data)
      message.success('创建成功')
      setModalOpen(false)
      loadData()
    } catch (e: any) {
      console.error(e)
      message.error(e?.response?.data?.message || '操作失败')
    }
  }

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      ACTIVE: 'orange',
      EXPIRED: 'default',
      CANCELLED: 'red'
    }
    const textMap: Record<string, string> = {
      ACTIVE: '冻结中',
      EXPIRED: '已到期',
      CANCELLED: '已取消'
    }
    return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '冻结编号', dataIndex: 'freezeNo', key: 'freezeNo' },
    {
      title: '会员',
      dataIndex: 'memberId',
      key: 'memberId',
      render: (memberId: number) => members.find((m) => m.id === memberId)?.name || memberId
    },
    { title: '冻结类型', dataIndex: 'freezeType', key: 'freezeType' },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate' },
    { title: '冻结天数', dataIndex: 'freezeDays', key: 'freezeDays' },
    { title: '原因', dataIndex: 'reason', key: 'reason' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => getStatusTag(status) },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MemberFreeze) => (
        <Space>
          {record.status === 'ACTIVE' && (
            <Button type="link" danger icon={<StopOutlined />} onClick={() => handleCancel(record.id)}>
              取消
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增冻结
        </Button>
      </div>

      <Table columns={columns} dataSource={freezes} rowKey="id" loading={loading} />

      <Modal
        title="新增冻结"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="memberId" label="会员" rules={[{ required: true, message: '请选择会员' }]}>
            <Select placeholder="请选择会员">
              {members.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.name} ({m.memberNo})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="freezeType" label="冻结类型" rules={[{ required: true, message: '请选择冻结类型' }]}>
            <Select placeholder="请选择冻结类型">
              <Select.Option value="TEMPORARY">临时冻结</Select.Option>
              <Select.Option value="INJURY">伤病冻结</Select.Option>
              <Select.Option value="VACATION">假期冻结</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="冻结日期范围" rules={[{ required: true, message: '请选择冻结日期范围' }]}>
            <Space>
              <Form.Item name="startDate" noStyle rules={[{ required: true, message: '请选择开始日期' }]}>
                <DatePicker placeholder="开始日期" />
              </Form.Item>
              <Form.Item name="endDate" noStyle rules={[{ required: true, message: '请选择结束日期' }]}>
                <DatePicker placeholder="结束日期" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="reason" label="原因">
            <Input.TextArea rows={3} placeholder="请输入原因" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FreezeList
