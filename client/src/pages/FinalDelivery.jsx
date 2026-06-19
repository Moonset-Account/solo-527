import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Button, Space, Tag, message, Alert,
  Spin, Empty, Row, Col, Statistic, Divider, Progress, Tooltip,
  Result, Modal, Form, InputNumber
} from 'antd'
import {
  ArrowLeftOutlined, DownloadOutlined, CheckOutlined,
  SyncOutlined, PictureOutlined, InfoCircleOutlined,
  CloudDownloadOutlined, PlusOutlined
} from '@ant-design/icons'
import {
  getOrder, getFinalPhotos, downloadFinalPhoto, createFinalPhoto
} from '../services/api'
import dayjs from 'dayjs'

function FinalDelivery() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [batchDownloading, setBatchDownloading] = useState(false)
  const [orderError, setOrderError] = useState(null)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [addForm] = Form.useForm()

  const isNumericOrderId = !isNaN(Number(orderId))

  useEffect(() => {
    loadData()
  }, [orderId])

  const loadData = async () => {
    if (!isNumericOrderId) {
      setOrderError(true)
      return
    }
    setLoading(true)
    setOrderError(null)
    try {
      const orderData = await getOrder(orderId)
      setOrder(orderData)

      const photoRes = await getFinalPhotos({ orderId })
      setPhotos(photoRes.list || [])
    } catch (err) {
      console.error('加载订单失败:', err)
      if (err.response?.status === 404 || !err.message?.includes('500')) {
        setOrderError(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async photo => {
    setDownloading(photo.id)
    try {
      await downloadFinalPhoto(photo.id)
      message.success(`开始下载：${photo.photoName}`)

      const link = document.createElement('a')
      link.href = photo.photoUrl
      link.download = photo.photoName
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      loadData()
    } catch (err) {
      console.error(err)
      message.error('下载失败，请重试')
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadAll = async () => {
    const undownloaded = photos.filter(p => !p.isDownloaded)
    if (undownloaded.length === 0) {
      message.info('所有照片已下载完成')
      return
    }

    Modal.confirm({
      title: '批量下载',
      content: `即将下载 ${undownloaded.length} 张照片，请允许浏览器弹出多个下载窗口。确定开始下载吗？`,
      onOk: async () => {
        setBatchDownloading(true)
        let successCount = 0
        for (let i = 0; i < undownloaded.length; i++) {
          const photo = undownloaded[i]
          try {
            await downloadFinalPhoto(photo.id)
            const link = document.createElement('a')
            link.href = photo.photoUrl
            link.download = photo.photoName
            link.target = '_blank'
            link.rel = 'noopener noreferrer'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            successCount++
            await new Promise(r => setTimeout(r, 800))
          } catch (err) {
            console.error(`下载 ${photo.photoName} 失败:`, err)
          }
        }
        message.success(`下载完成：成功 ${successCount} / ${undownloaded.length} 张`)
        setBatchDownloading(false)
        loadData()
      }
    })
  }

  const handleAddMockPhotos = async () => {
    const count = addForm.getFieldValue('count') || 5
    const mockPhotos = []
    for (let i = 1; i <= count; i++) {
      const size = Math.floor(Math.random() * 5 + 2) * 1024 * 1024
      mockPhotos.push({
        orderId: Number(orderId),
        photoUrl: `https://picsum.photos/1200/800?random=${Date.now() + i}`,
        photoName: `精修成片_${String(i).padStart(3, '0')}.jpg`,
        fileSize: size
      })
    }
    try {
      await createFinalPhoto({ photos: mockPhotos })
      message.success(`成功添加 ${count} 张示例成片`)
      setAddModalVisible(false)
      addForm.resetFields()
      loadData()
    } catch (err) {
      console.error(err)
      message.error('添加成片失败')
    }
  }

  const downloadedCount = photos.filter(p => p.isDownloaded).length
  const totalSize = photos.reduce((sum, p) => sum + (p.fileSize || 0), 0)
  const downloadProgress = photos.length > 0 ? (downloadedCount / photos.length) * 100 : 0

  const formatFileSize = bytes => {
    if (!bytes || bytes < 1024) return (bytes || 0) + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  if (orderError || !isNumericOrderId) {
    return (
      <div className="page-content">
        <div className="page-header">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>返回订单列表</Button>
            <h2 style={{ margin: 0 }}>成片下载</h2>
          </Space>
        </div>
        <Card>
          <Result
            status="warning"
            title="订单不存在"
            subTitle={`没有找到订单ID为 "${orderId}" 的订单，请从订单列表选择真实订单进入成片下载。`}
            extra={
              <Button type="primary" onClick={() => navigate('/orders')}>
                去订单列表
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>返回订单列表</Button>
          <h2 style={{ margin: 0 }}>成片下载</h2>
          {order?.finalDelivery && <Tag color="green" icon={<CheckOutlined />}>已交付</Tag>}
        </Space>
      </div>

      {order?.finalDelivery ? (
        <Alert
          className="sync-error-tip"
          type="success"
          showIcon
          message="成片已交付"
          description="所有成片已准备好，您可以下载高清原图。建议使用电脑浏览器下载以获得最佳体验。"
        />
      ) : (
        <Alert
          className="sync-error-tip"
          type="warning"
          showIcon
          message="成片制作中"
          description="摄影师正在努力修片中，请耐心等待。您也可以先预览已上传的成片。"
          action={
            <Button size="small" type="primary" onClick={() => navigate(`/photo-selection/${orderId}`)}>
              返回选片
            </Button>
          }
        />
      )}

      {order && (
        <Card style={{ marginBottom: 16 }} size="small">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="订单号" value={order.orderNo} />
            </Col>
            <Col span={6}>
              <Statistic title="成片数量" value={`${photos.length}`} suffix="张" />
            </Col>
            <Col span={6}>
              <Statistic
                title="已下载"
                value={`${downloadedCount}/${photos.length}`}
                suffix="张"
                valueStyle={{ color: downloadedCount === photos.length ? '#52c41a' : '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="总大小" value={formatFileSize(totalSize)} />
            </Col>
          </Row>
          {photos.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Progress
                percent={downloadProgress}
                status={downloadedCount === photos.length ? 'success' : 'active'}
                format={percent => `下载进度 ${percent.toFixed(0)}%`}
              />
            </div>
          )}
        </Card>
      )}

      {photos.length === 0 ? (
        <Card>
          <Empty
            image={<PictureOutlined style={{ fontSize: 48, color: '#ccc' }} />}
            description="暂未交付成片，请等待摄影师修片完成"
          >
            <Space>
              <Button onClick={loadData} icon={<SyncOutlined />}>刷新</Button>
              <Button type="primary" onClick={() => setAddModalVisible(true)} icon={<PlusOutlined />}>
                添加示例成片
              </Button>
            </Space>
          </Empty>
        </Card>
      ) : (
        <>
          <div className="table-toolbar">
            <Space>
              <Button icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
                添加成片
              </Button>
              <Tooltip title="下载所有未下载的照片">
                <Button
                  type="primary"
                  icon={<CloudDownloadOutlined />}
                  onClick={handleDownloadAll}
                  disabled={downloadedCount === photos.length}
                  loading={batchDownloading}
                >
                  批量下载
                </Button>
              </Tooltip>
              <Button icon={<SyncOutlined />} onClick={loadData}>刷新</Button>
            </Space>
            <span style={{ color: '#666' }}>
              已下载 <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{downloadedCount}</span> / {photos.length} 张
            </span>
          </div>

          <div className="photo-grid">
            {photos.map(photo => (
              <div key={photo.id} className="photo-item" style={{ cursor: 'default' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={photo.photoUrl}
                    alt={photo.photoName}
                    loading="lazy"
                    style={{ display: 'block' }}
                  />
                  {photo.isDownloaded && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#52c41a',
                      color: 'white',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      <CheckOutlined />
                    </div>
                  )}
                </div>
                <div className="photo-info">
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{photo.photoName}</div>
                  <div style={{ color: '#999', fontSize: 11, marginBottom: 8 }}>
                    {formatFileSize(photo.fileSize || 0)}
                    {photo.fileSize && ` · ${Math.round(photo.fileSize / (1024 * 1024))}MB`}
                  </div>
                  <Button
                    size="small"
                    type={photo.isDownloaded ? 'default' : 'primary'}
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(photo)}
                    loading={downloading === photo.id}
                    block
                  >
                    {photo.isDownloaded ? '重新下载' : '下载'}
                  </Button>
                  {photo.downloadedAt && (
                    <div style={{ color: '#52c41a', fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                      上次下载：{dayjs(photo.downloadedAt).format('MM-DD HH:mm')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Divider />

          <div style={{ textAlign: 'center', color: '#666' }}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            点击「下载」按钮保存高清原图，建议使用电脑浏览器下载以获得最佳体验
          </div>
        </>
      )}

      <Modal
        title="添加示例成片"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddMockPhotos}>
          <Form.Item name="count" label="成片数量" initialValue={5}>
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">添加</Button>
              <Button onClick={() => setAddModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FinalDelivery
