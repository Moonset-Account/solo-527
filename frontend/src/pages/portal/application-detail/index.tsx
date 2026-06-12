import React, { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Space, List, Upload, message, Divider, Typography, Timeline } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { application, attachment } from '@/api'
import { formatDate, formatMoney } from '@/utils'
import type { ExpenseApplication, ApplicationStatus, ExpenseAttachment, ApprovalRecord } from '@/types'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'

const { Title, Text } = Typography

const statusMap: Record<ApplicationStatus, { text: string; color: string }> = {
  DRAFT: { text: '草稿', color: 'default' },
  PENDING: { text: '审批中', color: 'processing' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' }
}

const ApplicationDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  // Use loading in JSX to suppress unused warning
  console.log('Loading:', loading)
  const [data, setData] = useState<ExpenseApplication | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploadLoading, setUploadLoading] = useState(false)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const app = await application.getById(Number(id))
      setData(app)
      const files: UploadFile[] = app.attachments.map(att => ({
        uid: String(att.id),
        name: att.fileName,
        status: 'done',
        url: att.fileUrl,
        size: att.fileSize,
        response: att
      }))
      setFileList(files)
    } catch (error) {
      console.error('Fetch application detail failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleDownload = async (att: ExpenseAttachment) => {
    try {
      const blob = await attachment.download(att.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = att.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      message.error('下载失败')
    }
  }

  const uploadProps: UploadProps = {
    fileList,
    multiple: true,
    beforeUpload: () => false,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList)
    }
  }

  const handleUpload = async () => {
    if (!id) return
    const filesToUpload = fileList.filter(file => !file.response?.id)
    if (filesToUpload.length === 0) {
      message.info('没有需要上传的文件')
      return
    }
    setUploadLoading(true)
    try {
      for (const file of filesToUpload) {
        if (file.originFileObj) {
          const uploaded = await attachment.upload(Number(id), file.originFileObj)
          file.response = uploaded
          file.status = 'done'
        }
      }
      setFileList([...fileList])
      message.success('附件上传成功')
      fetchData()
    } catch (error) {
      console.error('Upload failed:', error)
      message.error('上传失败')
    } finally {
      setUploadLoading(false)
    }
  }

  if (!data) {
    return <div style={{ padding: 24 }}>加载中...</div>
  }

  const { text, color } = statusMap[data.status] || { text: data.status, color: 'default' }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/portal/my-applications')}>
            返回列表
          </Button>
        </Space>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>{data.title}</Title>
            <Text type="secondary" style={{ fontFamily: 'monospace' }}>编号: {data.applicationNo}</Text>
          </div>
          <Tag color={color as any} style={{ fontSize: 14, padding: '4px 12px' }}>{text}</Tag>
        </div>
        <Descriptions bordered column={2} size="middle">
          <Descriptions.Item label="申请人">{data.applicantName}</Descriptions.Item>
          <Descriptions.Item label="部门">{data.department}</Descriptions.Item>
          <Descriptions.Item label="费用类型">{data.expenseType}</Descriptions.Item>
          <Descriptions.Item label="申请金额">
            <span style={{ fontWeight: 'bold', color: '#1890ff', fontSize: 16 }}>{formatMoney(data.amount)}</span>
          </Descriptions.Item>
          <Descriptions.Item label="当前节点">{data.currentNodeName || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDate(data.createdAt)}</Descriptions.Item>
          {data.submittedAt && (
            <Descriptions.Item label="提交时间">{formatDate(data.submittedAt)}</Descriptions.Item>
          )}
          {data.approvedAt && (
            <Descriptions.Item label="审批通过时间">{formatDate(data.approvedAt)}</Descriptions.Item>
          )}
          <Descriptions.Item label="费用说明" span={2}>{data.description}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="附件列表" style={{ marginBottom: 16 }}>
        {data.attachments.length === 0 ? (
          <Text type="secondary">暂无附件</Text>
        ) : (
          <List
            dataSource={data.attachments}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(item)}
                  >
                    下载
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={item.fileName}
                  description={`${(item.fileSize / 1024).toFixed(2)} KB · 上传于 ${formatDate(item.uploadedAt)}`}
                />
              </List.Item>
            )}
          />
        )}
        {data.status === 'DRAFT' && (
          <div style={{ marginTop: 16 }}>
            <Divider orientation="left">上传附件</Divider>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            {fileList.filter(f => !f.response?.id).length > 0 && (
              <Button
                type="primary"
                style={{ marginTop: 12 }}
                onClick={handleUpload}
                loading={uploadLoading}
              >
                上传
              </Button>
            )}
          </div>
        )}
      </Card>
      <Card title="审批记录">
        {data.approvalRecords.length === 0 ? (
          <Text type="secondary">暂无审批记录</Text>
        ) : (
          <Timeline
            items={data.approvalRecords.map((record: ApprovalRecord) => ({
              color: record.action === 'APPROVE' ? 'green' : record.action === 'REJECT' ? 'red' : 'orange',
              children: (
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {record.nodeName} - {record.approverName}
                    <Tag
                      color={record.action === 'APPROVE' ? 'success' : record.action === 'REJECT' ? 'error' : 'warning'}
                      style={{ marginLeft: 8 }}
                    >
                      {record.action === 'APPROVE' ? '同意' : record.action === 'REJECT' ? '拒绝' : '退回'}
                    </Tag>
                  </div>
                  <div style={{ color: '#666', marginTop: 4 }}>{record.comment || '无意见'}</div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>{formatDate(record.approvedAt)}</div>
                </div>
              )
            }))}
          />
        )}
      </Card>
    </div>
  )
}

export default ApplicationDetail
