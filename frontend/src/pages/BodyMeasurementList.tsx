import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  Typography,
  message,
  Image,
  Descriptions,
  Card,
  Space,
} from 'antd'
import { PlusOutlined, EyeOutlined, FileImageOutlined } from '@ant-design/icons'
import { bodyMeasurementApi, memberApi, attachmentApi } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography
const { TextArea } = Input

export default function BodyMeasurementList() {
  const [measurements, setMeasurements] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentMeasurement, setCurrentMeasurement] = useState<any>(null)
  const [attachments, setAttachments] = useState<any[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadMembers()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data: any = await bodyMeasurementApi.list()
      setMeasurements(data)
    } catch (error) {
      console.error(error)
      message.error('加载体测记录失败')
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const data: any = await memberApi.list()
      setMembers(data)
    } catch (error) {
      console.error(error)
    }
  }

  const loadAttachments = async (measurementId: number) => {
    try {
      const data: any = await attachmentApi.listByRelated('BODY_MEASUREMENT', measurementId)
      setAttachments(data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleViewDetail = async (record: any) => {
    setCurrentMeasurement(record)
    setDetailVisible(true)
    await loadAttachments(record.id)
  }

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        measureDate: values.measureDate ? values.measureDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      }
      await bodyMeasurementApi.create(submitData)
      message.success('体测记录创建成功')
      setModalVisible(false)
      loadData()
    } catch (error) {
      console.error(error)
      message.error('创建失败')
    }
  }

  const columns = [
    {
      title: '会员',
      dataIndex: ['member', 'name'],
      key: 'member',
    },
    {
      title: '测量日期',
      dataIndex: 'measureDate',
      key: 'measureDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '身高',
      dataIndex: 'height',
      key: 'height',
      render: (val: number) => (val ? `${val} cm` : '-'),
    },
    {
      title: '体重',
      dataIndex: 'weight',
      key: 'weight',
      render: (val: number) => (val ? `${val} kg` : '-'),
    },
    {
      title: 'BMI',
      dataIndex: 'bmi',
      key: 'bmi',
    },
    {
      title: '体脂率',
      dataIndex: 'bodyFatRate',
      key: 'bodyFatRate',
      render: (val: number) => (val ? `${val}%` : '-'),
    },
    {
      title: '照片',
      dataIndex: 'photos',
      key: 'photos',
      render: (photos: string) => {
        if (!photos) return '-'
        const photoList = photos.split(',')
        return (
          <Tag icon={<FileImageOutlined />} color="blue">
            {photoList.length} 张
          </Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          体测记录
        </Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增体测记录
          </Button>
          <Button type="default" href="#/m/body-measurement" target="_blank">
            移动端录入
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={measurements}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="新增体测记录"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="memberId"
            label="会员"
            rules={[{ required: true, message: '请选择会员' }]}
          >
            <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
              <option value="">请选择会员</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.phone})
                </option>
              ))}
            </select>
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="height" label="身高(cm)">
              <InputNumber min={0} max={300} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="weight" label="体重(kg)">
              <InputNumber min={0} max={500} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="bmi" label="BMI">
              <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="bodyFatRate" label="体脂率(%)">
              <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="muscleMass" label="肌肉量(kg)">
              <InputNumber min={0} max={200} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="basalMetabolism" label="基础代谢">
              <InputNumber min={0} max={10000} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="note" label="备注">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="体测记录详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {currentMeasurement && (
          <div>
            <Descriptions title="基本信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="会员">
                {currentMeasurement.member?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="测量日期">
                {dayjs(currentMeasurement.measureDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="身高">
                {currentMeasurement.height ? `${currentMeasurement.height} cm` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="体重">
                {currentMeasurement.weight ? `${currentMeasurement.weight} kg` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="BMI">
                {currentMeasurement.bmi || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="体脂率">
                {currentMeasurement.bodyFatRate ? `${currentMeasurement.bodyFatRate}%` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="肌肉量">
                {currentMeasurement.muscleMass ? `${currentMeasurement.muscleMass} kg` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="基础代谢">
                {currentMeasurement.basalMetabolism || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="腰围">
                {currentMeasurement.waist ? `${currentMeasurement.waist} cm` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="臀围">
                {currentMeasurement.hip ? `${currentMeasurement.hip} cm` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="胸围">
                {currentMeasurement.chest ? `${currentMeasurement.chest} cm` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {currentMeasurement.note || '-'}
              </Descriptions.Item>
            </Descriptions>

            {attachments.length > 0 && (
              <Card title="体测照片" size="small">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {attachments.map((att: any) => (
                    <Image
                      key={att.id}
                      width={120}
                      height={120}
                      src={att.filePath}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
