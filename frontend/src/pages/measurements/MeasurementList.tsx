import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Space, message, Row, Col } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { measurementApi, memberApi } from '@/api'
import type { BodyMeasurement, Member } from '@/types'
import dayjs from 'dayjs'

const MeasurementList: React.FC = () => {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingMeasurement, setViewingMeasurement] = useState<BodyMeasurement | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [measurementData, memberData] = await Promise.all([
        memberApi.list().then((members) => 
          Promise.all(members.map((m) => measurementApi.getByMember(m.id)))
        ).then((results) => results.flat()),
        memberApi.list()
      ])
      setMeasurements(measurementData)
      setMembers(memberData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingMeasurement(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: BodyMeasurement) => {
    setEditingMeasurement(record)
    form.setFieldsValue({
      ...record,
      measureDate: record.measureDate ? dayjs(record.measureDate) : null
    })
    setModalOpen(true)
  }

  const handleView = (record: BodyMeasurement) => {
    setViewingMeasurement(record)
    setViewModalOpen(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        measureDate: values.measureDate ? values.measureDate.format('YYYY-MM-DD') : null
      }
      if (editingMeasurement) {
        await measurementApi.update(editingMeasurement.id, data)
        message.success('更新成功')
      } else {
        await measurementApi.create(data)
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
    { title: '测量日期', dataIndex: 'measureDate', key: 'measureDate' },
    { title: '身高(cm)', dataIndex: 'height', key: 'height' },
    { title: '体重(kg)', dataIndex: 'weight', key: 'weight' },
    { title: 'BMI', dataIndex: 'bmi', key: 'bmi' },
    { title: '体脂率(%)', dataIndex: 'bodyFat', key: 'bodyFat' },
    { title: '肌肉量(kg)', dataIndex: 'muscleMass', key: 'muscleMass' },
    {
      title: '附件',
      dataIndex: 'attachmentUrl',
      key: 'attachmentUrl',
      render: (url: string) => url ? <a href={url} target="_blank" rel="noopener noreferrer">查看</a> : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BodyMeasurement) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" onClick={() => handleEdit(record)}>
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
          新增体测
        </Button>
      </div>

      <Table columns={columns} dataSource={measurements} rowKey="id" loading={loading} />

      <Modal
        title={editingMeasurement ? '编辑体测记录' : '新增体测记录'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={700}
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
          <Form.Item name="measureDate" label="测量日期" rules={[{ required: true, message: '请选择测量日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="height" label="身高(cm)">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入身高" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="weight" label="体重(kg)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="请输入体重" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bmi" label="BMI">
                <InputNumber style={{ width: '100%' }} step={0.1} placeholder="自动计算或手动输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bodyFat" label="体脂率(%)">
                <InputNumber style={{ width: '100%' }} step={0.1} placeholder="请输入体脂率" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="muscleMass" label="肌肉量(kg)">
                <InputNumber style={{ width: '100%' }} step={0.1} placeholder="请输入肌肉量" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="waist" label="腰围(cm)">
                <InputNumber style={{ width: '100%' }} step={0.1} placeholder="请输入腰围" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="hip" label="臀围(cm)">
                <InputNumber style={{ width: '100%' }} step={0.1} placeholder="请输入臀围" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="chest" label="胸围(cm)">
                <InputNumber style={{ width: '100%' }} step={0.1} placeholder="请输入胸围" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item name="attachmentUrl" label="附件">
            <Input placeholder="附件URL" />
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

      <Modal
        title="体测记录详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {viewingMeasurement && (
          <div>
            <p><strong>会员：</strong>{members.find((m) => m.id === viewingMeasurement.memberId)?.name}</p>
            <p><strong>测量日期：</strong>{viewingMeasurement.measureDate}</p>
            <p><strong>身高：</strong>{viewingMeasurement.height || '-'} cm</p>
            <p><strong>体重：</strong>{viewingMeasurement.weight || '-'} kg</p>
            <p><strong>BMI：</strong>{viewingMeasurement.bmi || '-'}</p>
            <p><strong>体脂率：</strong>{viewingMeasurement.bodyFat || '-'} %</p>
            <p><strong>肌肉量：</strong>{viewingMeasurement.muscleMass || '-'} kg</p>
            <p><strong>腰围：</strong>{viewingMeasurement.waist || '-'} cm</p>
            <p><strong>臀围：</strong>{viewingMeasurement.hip || '-'} cm</p>
            <p><strong>胸围：</strong>{viewingMeasurement.chest || '-'} cm</p>
            <p><strong>备注：</strong>{viewingMeasurement.remark || '-'}</p>
            {viewingMeasurement.attachmentUrl && (
              <p><strong>附件：</strong><a href={viewingMeasurement.attachmentUrl} target="_blank" rel="noopener noreferrer">查看附件</a></p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MeasurementList
