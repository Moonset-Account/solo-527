import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, DatePicker, Space, message } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { coachApi } from '@/api'
import type { Coach } from '@/types'
import dayjs from 'dayjs'

const CoachList: React.FC = () => {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadCoaches()
  }, [])

  const loadCoaches = async () => {
    setLoading(true)
    try {
      const data = await coachApi.list()
      setCoaches(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCoach(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: Coach) => {
    setEditingCoach(record)
    form.setFieldsValue({
      ...record,
      hireDate: record.hireDate ? dayjs(record.hireDate) : null
    })
    setModalOpen(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        hireDate: values.hireDate ? values.hireDate.format('YYYY-MM-DD') : null
      }
      if (editingCoach) {
        await coachApi.update(editingCoach.id, data)
        message.success('更新成功')
      } else {
        await coachApi.create(data)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadCoaches()
    } catch (e) {
      console.error(e)
    }
  }

  const columns = [
    { title: '教练编号', dataIndex: 'coachNo', key: 'coachNo' },
    { title: '用户ID', dataIndex: 'userId', key: 'userId' },
    { title: '专长', dataIndex: 'specialty', key: 'specialty' },
    { title: '入职日期', dataIndex: 'hireDate', key: 'hireDate' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Coach) => (
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
          新增教练
        </Button>
      </div>

      <Table columns={columns} dataSource={coaches} rowKey="id" loading={loading} />

      <Modal
        title={editingCoach ? '编辑教练' : '新增教练'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="userId" label="用户ID" rules={[{ required: true, message: '请输入用户ID' }]}>
            <Input type="number" placeholder="请输入用户ID" />
          </Form.Item>
          <Form.Item name="coachNo" label="教练编号" rules={[{ required: true, message: '请输入教练编号' }]}>
            <Input placeholder="请输入教练编号" />
          </Form.Item>
          <Form.Item name="specialty" label="专长">
            <Input placeholder="请输入专长" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="hireDate" label="入职日期">
            <DatePicker style={{ width: '100%' }} />
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

export default CoachList
