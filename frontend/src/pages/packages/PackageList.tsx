import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Space, message } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { packageApi, memberApi, coachApi } from '@/api'
import type { MemberPackage, Member, Coach } from '@/types'
import dayjs from 'dayjs'

const PackageList: React.FC = () => {
  const [packages, setPackages] = useState<MemberPackage[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<MemberPackage | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pkgData, memberData, coachData] = await Promise.all([
        packageApi.list(),
        memberApi.list(),
        coachApi.list()
      ])
      setPackages(pkgData)
      setMembers(memberData)
      setCoaches(coachData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingPackage(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: MemberPackage) => {
    setEditingPackage(record)
    form.setFieldsValue({
      ...record,
      purchaseDate: record.purchaseDate ? dayjs(record.purchaseDate) : null,
      expireDate: record.expireDate ? dayjs(record.expireDate) : null
    })
    setModalOpen(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        purchaseDate: values.purchaseDate ? values.purchaseDate.format('YYYY-MM-DD') : null,
        expireDate: values.expireDate ? values.expireDate.format('YYYY-MM-DD') : null
      }
      if (editingPackage) {
        await packageApi.update(editingPackage.id, data)
        message.success('更新成功')
      } else {
        await packageApi.create(data)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    {
      title: '会员',
      dataIndex: 'memberId',
      key: 'memberId',
      render: (memberId: number) => members.find((m) => m.id === memberId)?.name || memberId
    },
    {
      title: '教练',
      dataIndex: 'coachId',
      key: 'coachId',
      render: (coachId: number) => {
        if (!coachId) return '-'
        const coach = coaches.find((c) => c.id === coachId)
        return coach?.coachNo || coachId
      }
    },
    { title: '总课时', dataIndex: 'totalSessions', key: 'totalSessions' },
    { title: '剩余课时', dataIndex: 'remainingSessions', key: 'remainingSessions' },
    { title: '已用课时', dataIndex: 'usedSessions', key: 'usedSessions' },
    { title: '购买日期', dataIndex: 'purchaseDate', key: 'purchaseDate' },
    { title: '到期日期', dataIndex: 'expireDate', key: 'expireDate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'ACTIVE' ? '#10B981' : '#EF4444' }}>
          {status === 'ACTIVE' ? '活跃' : status === 'EXPIRED' ? '已过期' : status}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MemberPackage) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增课包
        </Button>
      </div>

      <Table columns={columns} dataSource={packages} rowKey="id" loading={loading} />

      <Modal
        title={editingPackage ? '编辑课包' : '新增课包'}
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
          <Form.Item name="packageTypeId" label="课包类型ID" rules={[{ required: true, message: '请输入课包类型ID' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="请输入课包类型ID" />
          </Form.Item>
          <Form.Item name="coachId" label="教练">
            <Select placeholder="请选择教练">
              {coaches.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.coachNo}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="totalSessions" label="总课时" rules={[{ required: true, message: '请输入总课时' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入总课时" />
          </Form.Item>
          <Form.Item name="remainingSessions" label="剩余课时" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入剩余课时" />
          </Form.Item>
          <Form.Item name="purchaseDate" label="购买日期" rules={[{ required: true, message: '请选择购买日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expireDate" label="到期日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="ACTIVE">
            <Select>
              <Select.Option value="ACTIVE">活跃</Select.Option>
              <Select.Option value="EXPIRED">已过期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
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

export default PackageList
