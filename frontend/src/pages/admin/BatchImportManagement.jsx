
import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Select, Modal, Tag, message, Upload, Progress, List, Descriptions } from 'antd'
import { UploadOutlined, DownloadOutlined, ReloadOutlined, EyeOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons'
import { getBatchImports, uploadBatchImport, downloadErrors, retryBatchImport, deleteBatchImport } from '../../api/batchImports'

const { Option } = Select

const BatchImportManagement = () => {
  const [data, setData] = useState([])
  const [typeFilter, setTypeFilter] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [uploadVisible, setUploadVisible] = useState(false)
  const [importType, setImportType] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)

  const statusMap = {
    completed: { text: '已完成', color: 'green' },
    processing: { text: '处理中', color: 'blue' },
    failed: { text: '失败', color: 'red' },
    partial: { text: '部分成功', color: 'orange' },
  }

  const typeMap = {
    product: '产品',
    member: '会员',
  }

  const loadData = async () => {
    const params = { pageSize: 50 }
    if (typeFilter) {
      params.type = typeFilter
    }
    const res = await getBatchImports(params)
    if (res.success) {
      setData(res.data.list || [])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadData()
  }, [typeFilter])

  const handleDetail = (record) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  const handleRetry = (record) => {
    Modal.confirm({
      title: '确认重试',
      content: `确定要重试导入记录 ${record.fileName} 吗？`,
      onOk: async () => {
        const res = await retryBatchImport(record.id)
        if (res.success) {
          message.success('已开始重试')
          loadData()
        }
      },
    })
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除导入记录 ${record.fileName} 吗？`,
      onOk: async () => {
        const res = await deleteBatchImport(record.id)
        if (res.success) {
          message.success('删除成功')
          loadData()
        }
      },
    })
  }

  const handleDownloadError = async (record) => {
    try {
      const res = await downloadErrors(record.id)
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `导入错误记录_${record.id}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('下载成功')
    } catch (error) {
      message.error('下载失败')
    }
  }

  const handleUpload = async () => {
    if (!importType) {
      message.error('请选择导入类型')
      return
    }
    if (!uploadFile) {
      message.error('请选择上传文件')
      return
    }
    setUploading(true)
    setUploadProgress(0)

    try {
      const res = await uploadBatchImport(uploadFile, importType)
      if (res.success) {
        setUploadProgress(100)
        setTimeout(() => {
          setUploading(false)
          setUploadVisible(false)
          setUploadFile(null)
          setUploadProgress(0)
          message.success('导入完成')
          loadData()
        }, 500)
      }
    } catch (error) {
      setUploading(false)
      message.error('上传失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '导入类型', dataIndex: 'type', key: 'type', width: 100, render: (t) => typeMap[t] || t },
    { title: '文件名', dataIndex: 'fileName', key: 'fileName', icon: <FileTextOutlined /> },
    { title: '总数量', dataIndex: 'totalCount', key: 'totalCount', width: 100 },
    {
      title: '成功',
      dataIndex: 'successCount',
      key: 'successCount',
      width: 100,
      render: (text) => <span style={{ color: '#52c41a' }}>{text}</span>,
    },
    {
      title: '失败',
      dataIndex: 'failCount',
      key: 'failCount',
      width: 100,
      render: (text) => <span style={{ color: text > 0 ? '#ff4d4f' : 'inherit' }}>{text}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => <Tag color={(statusMap[text] || {}).color || 'default'}>{(statusMap[text] || {}).text || text}</Tag>,
    },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100, render: (op) => op?.name || '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (t) => t ? new Date(t).toLocaleString() : '-' },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>详情</Button>
          {record.failCount > 0 && (
            <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadError(record)}>下载错误</Button>
          )}
          {(record.status === 'failed' || record.status === 'partial') && (
            <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => handleRetry(record)}>重试</Button>
          )}
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ]

  const uploadProps = {
    beforeUpload: (file) => {
      setUploadFile(file)
      return false
    },
    maxCount: 1,
    onRemove: () => {
      setUploadFile(null)
    },
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>批量导入管理</h2>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="导入类型"
              value={typeFilter || undefined}
              onChange={setTypeFilter}
              allowClear
              style={{ width: 150 }}
            >
              <Option value="product">产品</Option>
              <Option value="member">会员</Option>
            </Select>
          </Space>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadVisible(true)}>
            批量导入
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="批量导入"
        open={uploadVisible}
        onOk={handleUpload}
        onCancel={() => {
          setUploadVisible(false)
          setUploadProgress(0)
          setUploading(false)
          setUploadFile(null)
        }}
        width={500}
        confirmLoading={uploading}
        okText="开始导入"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>导入类型</div>
          <Select
            placeholder="请选择导入类型"
            value={importType || undefined}
            onChange={setImportType}
            style={{ width: '100%' }}
          >
            <Option value="product">产品导入</Option>
            <Option value="member">会员导入</Option>
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>上传文件</div>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>选择 Excel 文件</Button>
          </Upload>
          <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
            支持 .xlsx 格式，文件大小不超过 10MB
          </div>
        </div>
        {uploading && (
          <Progress percent={uploadProgress} status="active" />
        )}
        <Button type="link" icon={<DownloadOutlined />} style={{ padding: 0 }}>
          下载导入模板
        </Button>
      </Modal>

      <Modal
        title="导入详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentItem && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="文件名">{currentItem.fileName}</Descriptions.Item>
              <Descriptions.Item label="类型">{typeMap[currentItem.type] || currentItem.type}</Descriptions.Item>
              <Descriptions.Item label="总数量">{currentItem.totalCount}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={(statusMap[currentItem.status] || {}).color || 'default'}>{(statusMap[currentItem.status] || {}).text || currentItem.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="成功数" contentStyle={{ color: '#52c41a' }}>{currentItem.successCount}</Descriptions.Item>
              <Descriptions.Item label="失败数" contentStyle={{ color: '#ff4d4f' }}>{currentItem.failCount}</Descriptions.Item>
              <Descriptions.Item label="操作人">{currentItem.operator?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentItem.createdAt ? new Date(currentItem.createdAt).toLocaleString() : '-'}</Descriptions.Item>
            </Descriptions>
            {currentItem.failCount > 0 && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 'bold' }}>失败记录示例：</div>
                <List
                  size="small"
                  bordered
                  dataSource={[
                    { row: 5, reason: '产品名称不能为空' },
                    { row: 12, reason: '价格格式不正确' },
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      第 {item.row} 行：{item.reason}
                    </List.Item>
                  )}
                />
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  style={{ marginTop: 16 }}
                  onClick={() => handleDownloadError(currentItem)}
                >
                  下载全部错误记录
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

export default BatchImportManagement
