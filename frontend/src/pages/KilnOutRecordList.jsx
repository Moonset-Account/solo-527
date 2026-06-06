import React, { useState, useEffect } from 'react'
import { 
  Table, Button, Modal, Form, Select, Upload, 
  Tag, Space, message, List, Image
} from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { kilnOutRecordApi, kilnRunApi, kilnRunDetail } from '../api'
import dayjs from 'dayjs'

const qualityMap = {
  PERFECT: { text: '完美', color: 'green' },
  GOOD: { text: '良好', color: 'blue' },
  MINOR_DEFECT: { text: '轻微瑕疵', color: 'orange' },
  DAMAGED: { text: '破损', color: 'red' }
}

export default function KilnOutRecordList() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createModal, setCreateModal] = useState(false)
  const [photoModal, setPhotoModal] = useState(false)
  const [currentArtworkId, setCurrentArtworkId] = useState(null)
  const [photos, setPhotos] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [page, pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await kilnOutRecordApi.list({ page: page - 1, size: pageSize })
      setData(result.content)
      setTotal(result.totalElements)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      await kilnOutRecordApi.create(values)
      message.success('记录成功')
      setCreateModal(false)
      form.resetFields()
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const viewPhotos = async (artworkId) => {
    setCurrentArtworkId(artworkId)
    try {
      const data = await kilnOutRecordApi.getArtworkPhotos(artworkId)
      setPhotos(data)
      setPhotoModal(true)
    } catch (e) {
      console.error(e)
    }
  }

  const columns = [
    { 
      title: '出窑时间', 
      dataIndex: 'outTime', 
      width: 160,
      render: date => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    { title: '窑次ID', dataIndex: 'kilnRunId', width: 100 },
    { title: '作品ID', dataIndex: 'artworkId', width: 100 },
    { 
      title: '质量状态', 
      dataIndex: 'qualityStatus', 
      width: 120,
      render: status => <Tag color={qualityMap[status]?.color}>{qualityMap[status]?.text}</Tag>
    },
    { title: '备注', dataIndex: 'notes' },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => viewPhotos(record.artworkId)}>
            查看照片
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>出窑记录</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          记录出窑
        </Button>
      </div>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </div>

      <Modal
        title="记录出窑"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="kilnRunId" label="窑次" rules={[{ required: true }]}>
            <Select placeholder="请选择窑次">
              {/* 这里应该动态加载已完成的窑次 */}
              <Select.Option value={1}>窑次1</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="artworkId" label="作品" rules={[{ required: true }]}>
            <Select placeholder="请选择作品">
              <Select.Option value={1}>作品1</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="qualityStatus" label="质量状态" rules={[{ required: true }]}>
            <Select placeholder="请选择质量状态">
              {Object.entries(qualityMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.text}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Select />
          </Form.Item>
          <Form.Item label="上传照片">
            <Upload
              beforeUpload={() => false}
              multiple
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>上传照片</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="作品照片"
        open={photoModal}
        onCancel={() => setPhotoModal(false)}
        footer={null}
        width={700}
      >
        {photos.length > 0 ? (
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={photos}
            renderItem={item => (
              <List.Item>
                <Image width={200} src={item.photoUrl} />
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  {item.description || '出窑照片'}
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无照片
          </div>
        )}
      </Modal>
    </div>
  )
}
