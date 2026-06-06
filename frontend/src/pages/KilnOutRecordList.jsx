import React, { useState, useEffect } from 'react'
import { 
  Table, Button, Modal, Form, Select, Upload, 
  Tag, Space, message, List, Image, Input
} from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { kilnOutRecordApi, kilnRunApi, artworkApi, masterDataApi } from '../api'
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
  const [completedKilnRuns, setCompletedKilnRuns] = useState([])
  const [artworksByKiln, setArtworksByKiln] = useState([])
  const [uploadFiles, setUploadFiles] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadCompletedKilnRuns()
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

  const loadCompletedKilnRuns = async () => {
    try {
      const result = await kilnRunApi.list({ status: 'COMPLETED', page: 0, size: 100 })
      setCompletedKilnRuns(result.content)
    } catch (e) {
      console.error(e)
    }
  }

  const loadArtworksByKiln = async (kilnRunId) => {
    try {
      const artworks = await artworkApi.getByKilnRun(kilnRunId)
      setArtworksByKiln(artworks)
    } catch (e) {
      console.error(e)
    }
  }

  const handleKilnRunChange = (kilnRunId) => {
    form.setFieldsValue({ artworkId: null })
    if (kilnRunId) {
      loadArtworksByKiln(kilnRunId)
    } else {
      setArtworksByKiln([])
    }
  }

  const handleCreate = async (values) => {
    try {
      const record = await kilnOutRecordApi.create({
        kilnRunId: values.kilnRunId,
        artworkId: values.artworkId,
        qualityStatus: values.qualityStatus,
        notes: values.notes
      })

      if (uploadFiles.length > 0) {
        for (const file of uploadFiles) {
          const formData = new FormData()
          formData.append('artworkId', values.artworkId)
          formData.append('kilnOutRecordId', record.id)
          formData.append('file', file.originFileObj)
          formData.append('description', file.name)
          await kilnOutRecordApi.uploadPhoto(formData)
        }
      }

      message.success('出窑记录成功，照片已关联')
      setCreateModal(false)
      form.resetFields()
      setUploadFiles([])
      setArtworksByKiln([])
      loadData()
    } catch (e) {
      console.error(e)
      message.error(e.response?.data?.message || '记录失败')
    }
  }

  const viewPhotos = async (artworkId) => {
    setCurrentArtworkId(artworkId)
    try {
      const result = await kilnOutRecordApi.getArtworkPhotos(artworkId)
      setPhotos(result || [])
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
      render: date => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setCreateModal(true)
          setUploadFiles([])
          setArtworksByKiln([])
        }}>
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
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="kilnRunId" label="选择窑次" rules={[{ required: true, message: '请选择窑次' }]}>
            <Select 
              placeholder="请选择已完成的窑次"
              onChange={handleKilnRunChange}
              showSearch
              optionFilterProp="children"
            >
              {completedKilnRuns.map(run => (
                <Select.Option key={run.id} value={run.id}>
                  {run.runCode} - {run.temperatureZone}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="artworkId" label="选择作品" rules={[{ required: true, message: '请选择作品' }]}>
            <Select 
              placeholder="请选择该窑次中的作品"
              disabled={!form.getFieldValue('kilnRunId')}
              showSearch
              optionFilterProp="children"
            >
              {artworksByKiln.map(artwork => (
                <Select.Option key={artwork.id} value={artwork.id}>
                  {artwork.artworkCode} - {artwork.name || '未命名作品'}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="qualityStatus" label="质量状态" rules={[{ required: true, message: '请选择质量状态' }]}>
            <Select placeholder="请选择质量状态">
              {Object.entries(qualityMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.text}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item label="上传出窑照片（关联到学员作品）">
            <Upload
              fileList={uploadFiles}
              beforeUpload={() => false}
              multiple
              listType="picture-card"
              onChange={({ fileList }) => setUploadFiles(fileList)}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传照片</div>
              </div>
            </Upload>
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              照片将自动关联到所选学员作品
            </div>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存记录</Button>
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
