import React, { useState, useEffect } from 'react'
import { 
  Card, Table, Button, Tag, Space, Descriptions, 
  List, Select, Modal, message, Divider
} from 'antd'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { kilnRunApi, artworkApi } from '../api'
import dayjs from 'dayjs'

const temperatureZoneMap = {
  LOW: '低温',
  MIDDLE: '中温',
  HIGH: '高温'
}

const statusMap = {
  DRAFT: { text: '草稿', color: 'default' },
  APPROVED: { text: '已审批', color: 'blue' },
  FIRING: { text: '烧制中', color: 'orange' },
  COMPLETED: { text: '已完成', color: 'green' }
}

export default function KilnRunDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [kilnRun, setKilnRun] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [availableArtworks, setAvailableArtworks] = useState([])
  const [assignModal, setAssignModal] = useState(false)
  const [selectedArtwork, setSelectedArtwork] = useState(null)

  useEffect(() => {
    loadDetail()
    loadArtworks()
  }, [id])

  const loadDetail = async () => {
    try {
      const data = await kilnRunApi.get(id)
      setKilnRun(data)
    } catch (e) {
      console.error(e)
    }
  }

  const loadArtworks = async () => {
    try {
      const data = await artworkApi.getByKilnRun(id)
      setArtworks(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAssign = async () => {
    try {
      await artworkApi.assign(selectedArtwork, id)
      message.success('安排入窑成功')
      setAssignModal(false)
      loadArtworks()
      loadDetail()
    } catch (e) {
      console.error(e)
    }
  }

  const artworkColumns = [
    { title: '作品编号', dataIndex: 'artworkCode', width: 180 },
    { title: '作品名称', dataIndex: 'name' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      width: 100,
      render: status => <Tag color={status === 'SCHEDULED' ? 'purple' : 'blue'}>{status}</Tag>
    },
    { title: '窑位', dataIndex: 'positionInKiln', width: 100 },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        kilnRun?.status === 'APPROVED' && (
          <Button type="link" size="small" danger onClick={async () => {
            await artworkApi.withdraw(record.id)
            message.success('撤回成功')
            loadArtworks()
            loadDetail()
          }}>
            撤回
          </Button>
        )
      )
    }
  ]

  if (!kilnRun) return <div>加载中...</div>

  return (
    <div className="page-container">
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/kiln-runs')}>
          返回列表
        </Button>
        <h2 style={{ margin: 0 }}>窑次详情 - {kilnRun.runCode}</h2>
        <Tag color={statusMap[kilnRun.status]?.color}>{statusMap[kilnRun.status]?.text}</Tag>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3}>
          <Descriptions.Item label="温区">{temperatureZoneMap[kilnRun.temperatureZone]}</Descriptions.Item>
          <Descriptions.Item label="容量">{kilnRun.usedCapacity}/{kilnRun.maxCapacity}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(kilnRun.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="计划时间">
            {kilnRun.scheduledStartTime ? dayjs(kilnRun.scheduledStartTime).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="开始时间">
            {kilnRun.actualStartTime ? dayjs(kilnRun.actualStartTime).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="完成时间">
            {kilnRun.actualEndTime ? dayjs(kilnRun.actualEndTime).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card 
        title="作品列表" 
        extra={kilnRun.status === 'APPROVED' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAssignModal(true)}>
            添加作品
          </Button>
        )}
      >
        <Table
          columns={artworkColumns}
          dataSource={artworks}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title="安排作品入窑"
        open={assignModal}
        onCancel={() => setAssignModal(false)}
        onOk={handleAssign}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="选择待安排的作品"
          onChange={setSelectedArtwork}
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          <Select.Option value={1}>AW20240101000001 - 青花瓷瓶</Select.Option>
          <Select.Option value={2}>AW20240101000002 - 紫砂壶</Select.Option>
        </Select>
      </Modal>
    </div>
  )
}
