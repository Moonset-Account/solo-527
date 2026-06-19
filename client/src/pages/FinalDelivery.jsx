import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Button, Space, Tag, message, Alert,
  Spin, Empty, Row, Col, Statistic, Divider, Progress, Tooltip
} from 'antd'
import {
  ArrowLeftOutlined, DownloadOutlined, CheckOutlined,
  SyncOutlined, PictureOutlined, InfoCircleOutlined,
  CloudDownloadOutlined
} from '@ant-design/icons'
import { getOrder, getFinalPhotos, downloadFinalPhoto, createFinalPhoto } from '../services/api'
import dayjs from 'dayjs'

function FinalDelivery() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    loadData()
  }, [orderId])

  const loadData = async () => {
    setLoading(true)
    try {
      const orderData = await getOrder(orderId)
      setOrder(orderData)

      const photoRes = await getFinalPhotos({ orderId })
      setPhotos(photoRes.list)
    } catch (err) {
      console.error(err)
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
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadAll = async () => {
    const undownloaded = photos.filter(p => !p.isDownloaded)
    if (undownloaded.length === 0) {
      message.info('所有照片已下载')
      return
    }
    message.success(`开始批量下载 ${undownloaded.length} 张照片`)
    for (const photo of undownloaded) {
      try {
        await downloadFinalPhoto(photo.id)
        const link = document.createElement('a')
        link.href = photo.photoUrl
        link.download = photo.photoName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        await new Promise(r => setTimeout(r, 500))
      } catch (err) {
        console.error(`下载 ${photo.photoName} 失败`, err)
      }
    }
    loadData()
  }

  const handleAddMockPhotos = async () => {
    const mockPhotos = [
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/1200/800?random=10', photoName: '精修成片_001.jpg', fileSize: 3145728 },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/1200/800?random=11', photoName: '精修成片_002.jpg', fileSize: 2621440 },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/1200/800?random=12', photoName: '精修成片_003.jpg', fileSize: 4194304 },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/1200/800?random=13', photoName: '精修成片_004.jpg', fileSize: 3670016 },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/1200/800?random=14', photoName: '精修成片_005.jpg', fileSize: 2097152 },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/1200/800?random=15', photoName: '精修成片_006.jpg', fileSize: 5242880 }
    ]
    try {
      await createFinalPhoto({ photos: mockPhotos })
      message.success('添加示例成片成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const downloadedCount = photos.filter(p => p.isDownloaded).length
  const totalSize = photos.reduce((sum, p) => sum + (p.fileSize || 0), 0)
  const downloadProgress = photos.length > 0 ? (downloadedCount / photos.length) * 100 : 0

  const formatFileSize = bytes => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  if (loading) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
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
          description="所有成片已准备好，您可以下载高清原图。"
        />
      ) : (
        <Alert
          className="sync-error-tip"
          type="warning"
          showIcon
          message="成片制作中"
          description="摄影师正在努力修片中，请耐心等待。"
        />
      )}

      {order && (
        <Card style={{ marginBottom: 16 }} size="small">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="订单号" value={order.orderNo} />
            </Col>
            <Col span={6}>
              <Statistic title="成片数量" value={photos.length} suffix="张" />
            </Col>
            <Col span={6}>
              <Statistic title="已下载" value={downloadedCount} suffix="张" />
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
            description="暂未交付成片"
          >
            <Button type="primary" onClick={handleAddMockPhotos}>添加示例成片</Button>
          </Empty>
        </Card>
      ) : (
        <>
          <div className="table-toolbar">
            <Space>
              <Button icon={<SyncOutlined />} onClick={loadData}>刷新</Button>
              <Tooltip title="下载所有未下载的照片">
                <Button
                  type="primary"
                  icon={<CloudDownloadOutlined />}
                  onClick={handleDownloadAll}
                  disabled={downloadedCount === photos.length}
                >
                  批量下载
                </Button>
              </Tooltip>
            </Space>
            <span style={{ color: '#666' }}>
              已下载 {downloadedCount} / {photos.length} 张
            </span>
          </div>

          <div className="photo-grid">
            {photos.map(photo => (
              <div key={photo.id} className="photo-item" style={{ cursor: 'default' }}>
                <div style={{ position: 'relative' }}>
                  <img src={photo.photoUrl} alt={photo.photoName} />
                  {photo.isDownloaded && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#52c41a',
                      color: 'white',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckOutlined />
                    </div>
                  )}
                </div>
                <div className="photo-info">
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{photo.photoName}</div>
                  <div style={{ color: '#999', fontSize: 11, marginBottom: 8 }}>
                    {formatFileSize(photo.fileSize || 0)}
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
    </div>
  )
}

export default FinalDelivery
