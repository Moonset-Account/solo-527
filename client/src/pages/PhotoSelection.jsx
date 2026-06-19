import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Button, Space, Tag, message, Checkbox, Alert,
  Spin, Result, Empty, Row, Col, Statistic, Divider
} from 'antd'
import {
  ArrowLeftOutlined, CheckOutlined, SyncOutlined,
  PictureOutlined, InfoCircleOutlined
} from '@ant-design/icons'
import { getOrder, getSelectedPhotos, confirmPhotoSelection, createSelectedPhoto } from '../services/api'
import dayjs from 'dayjs'

function PhotoSelection() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    loadData()
  }, [orderId])

  const loadData = async () => {
    setLoading(true)
    try {
      const orderData = await getOrder(orderId)
      setOrder(orderData)
      setConfirmed(orderData.clientConfirm)

      const photoRes = await getSelectedPhotos({ orderId })
      setPhotos(photoRes.list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const togglePhoto = photoId => {
    if (confirmed) return
    setPhotos(prev =>
      prev.map(p => p.id === photoId ? { ...p, isSelected: !p.isSelected } : p)
    )
  }

  const handleSelectAll = checked => {
    if (confirmed) return
    setPhotos(prev => prev.map(p => ({ ...p, isSelected: checked })))
  }

  const handleConfirm = async () => {
    const selectedCount = photos.filter(p => p.isSelected).length
    if (selectedCount === 0) {
      message.warning('请至少选择一张照片')
      return
    }

    setSubmitting(true)
    try {
      const selectedIds = photos.filter(p => p.isSelected).map(p => p.id)
      await confirmPhotoSelection(orderId, { photoIds: selectedIds })
      message.success('选片确认成功！')
      setConfirmed(true)
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddMockPhotos = async () => {
    const mockPhotos = [
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/600/400?random=1', photoName: '原图_001.jpg' },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/600/400?random=2', photoName: '原图_002.jpg' },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/600/400?random=3', photoName: '原图_003.jpg' },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/600/400?random=4', photoName: '原图_004.jpg' },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/600/400?random=5', photoName: '原图_005.jpg' },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/600/400?random=6', photoName: '原图_006.jpg' },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/600/400?random=7', photoName: '原图_007.jpg' },
      { orderId: Number(orderId), photoUrl: 'https://picsum.photos/600/400?random=8', photoName: '原图_008.jpg' }
    ]
    try {
      await createSelectedPhoto({ photos: mockPhotos })
      message.success('添加示例照片成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const selectedCount = photos.filter(p => p.isSelected).length

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
          <h2 style={{ margin: 0 }}>选片确认</h2>
          {confirmed && <Tag color="green" icon={<CheckOutlined />}>客户已确认</Tag>}
        </Space>
      </div>

      {confirmed && (
        <Alert
          className="sync-error-tip"
          type="success"
          showIcon
          message="选片已确认"
          description="您已完成选片确认，摄影师将按照您选择的照片进行后期修图。"
        />
      )}

      {order && (
        <Card style={{ marginBottom: 16 }} size="small">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="订单号" value={order.orderNo} />
            </Col>
            <Col span={6}>
              <Statistic title="订单标题" value={order.title} />
            </Col>
            <Col span={6}>
              <Statistic title="照片总数" value={photos.length} suffix="张" />
            </Col>
            <Col span={6}>
              <Statistic title="已选择" value={selectedCount} suffix="张" valueStyle={{ color: selectedCount > 0 ? '#1890ff' : '#999' }} />
            </Col>
          </Row>
        </Card>
      )}

      {photos.length === 0 ? (
        <Card>
          <Empty
            image={<PictureOutlined style={{ fontSize: 48, color: '#ccc' }} />}
            description="暂无选片照片"
          >
            <Button type="primary" onClick={handleAddMockPhotos}>添加示例照片</Button>
          </Empty>
        </Card>
      ) : (
        <>
          <div className="table-toolbar">
            <Space>
              <Checkbox
                checked={photos.length > 0 && selectedCount === photos.length}
                indeterminate={selectedCount > 0 && selectedCount < photos.length}
                onChange={e => handleSelectAll(e.target.checked)}
                disabled={confirmed}
              >
                全选
              </Checkbox>
              <span style={{ color: '#666' }}>
                已选择 <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{selectedCount}</span> 张
              </span>
            </Space>
            <Space>
              <Button icon={<SyncOutlined />} onClick={loadData}>刷新</Button>
              {!confirmed && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleConfirm}
                  loading={submitting}
                  disabled={selectedCount === 0}
                >
                  确认选片
                </Button>
              )}
            </Space>
          </div>

          <div className="photo-grid">
            {photos.map(photo => (
              <div
                key={photo.id}
                className={`photo-item ${photo.isSelected ? 'selected' : ''}`}
                onClick={() => togglePhoto(photo.id)}
              >
                <div style={{ position: 'relative' }}>
                  <img src={photo.photoUrl} alt={photo.photoName} />
                  {photo.isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#1890ff',
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
                  <div style={{ fontWeight: 500 }}>{photo.photoName}</div>
                  <div style={{ color: '#999', fontSize: 11 }}>
                    {photo.isSelected ? '已选中' : '点击选择'}
                    {photo.selectedAt && ` · ${dayjs(photo.selectedAt).format('MM-DD HH:mm')}`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Divider />

          <div style={{ textAlign: 'center', color: '#666' }}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            {confirmed
              ? '选片已确认，如需修改请联系摄影师'
              : '点击照片选择您喜欢的图片，确认后提交给摄影师'
            }
          </div>
        </>
      )}
    </div>
  )
}

export default PhotoSelection
