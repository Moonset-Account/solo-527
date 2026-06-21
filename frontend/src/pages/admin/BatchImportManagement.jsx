
import { useState } from 'react'
import { Card, Table, Button, Space, Select, Modal, Tag, message, Upload, Progress, List, Descriptions } from 'antd'
import { UploadOutlined, DownloadOutlined, ReloadOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons'
import { batchImportList } from './mockData'

const { Option } = Select

const BatchImportManagement = () => {
  const [data, setData] = useState(batchImportList)
  const [typeFilter, setTypeFilter] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [uploadVisible, setUploadVisible] = useState(false)
  const [importType, setImportType] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const statusMap = {
    completed: { text: '已完成', color: 'green' },
    processing: { text: '处理中', color: 'blue' },
    failed: { text: '失败', color: 'red' },
  }

  const filteredData = data.filter(item => !typeFilter || item.type === typeFilter)

  const handleDetail = (record) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  const handleRetry = (record) => {
    Modal.confirm({
      title: '确认重试',
      content: `确定要重试导入记录 ${record.fileName} 吗？`,
      onOk: () => {
        message.success('已开始重试')
      },
    })
  }

  const handleDownloadError = (record) => {
    message.success('错误记录下载中...')
  }

  const handleUpload = () => {
    if (!importType) {
      message.error('请选择导入类型')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setUploading(false)
          setUploadVisible(false)
          const newRecord = {
            id: Math.max(...data.map(d => d.id)) + 1,
            type: importType,
            fileName: `${importType}_${Date.now()}.xlsx`,
            totalCount: 50,
            successCount: 48,
            failCount: 2,
            status: 'completed',
            operator: '管理员',
            createTime: new Date().toLocaleString(),
          }
          setData([newRecord, ...data])
          message.success('导入完成')
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '导入类型', dataIndex: 'type', key: 'type', width: 100 },
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
      render: (text) => <Tag color={statusMap[text].color}>{statusMap[text].text}</Tag>,
    },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>详情</Button>
          {record.failCount > 0 && (
            <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadError(record)}>下载错误</Button>
          )}
          {record.status === 'failed' && (
            <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => handleRetry(record)}>重试</Button>
          )}
        </Space>
      ),
    },
  ]

  const uploadProps = {
    beforeUpload: () => false,
    maxCount: 1,
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
              <Option value="产品">产品</Option>
              <Option value="会员">会员</Option>
              <Option value="预约">预约</Option>
            </Select>
          </Space>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadVisible(true)}>
            批量导入
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
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
            <Option value="产品">产品导入</Option>
            <Option value="会员">会员导入</Option>
            <Option value="预约">预约导入</Option>
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
              <Descriptions.Item label="类型">{currentItem.type}</Descriptions.Item>
              <Descriptions.Item label="总数量">{currentItem.totalCount}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentItem.status].color}>{statusMap[currentItem.status].text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="成功数" contentStyle={{ color: '#52c41a' }}>{currentItem.successCount}</Descriptions.Item>
              <Descriptions.Item label="失败数" contentStyle={{ color: '#ff4d4f' }}>{currentItem.failCount}</Descriptions.Item>
              <Descriptions.Item label="操作人">{currentItem.operator}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentItem.createTime}</Descriptions.Item>
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
