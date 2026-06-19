import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Button, Space, Tag, message, Checkbox, Alert,
  Spin, Result, Empty, Row, Col, Statistic, Divider,
  Modal, Form, InputNumber
} from 'antd'
import {
  ArrowLeftOutlined, CheckOutlined, SyncOutlined,
  PictureOutlined, InfoCircleOutlined, PlusOutlined
} from '@ant-design/icons'
import {
  getOrder, getSelectedPhotos, confirmPhotoSelection,
  createSelectedPhoto, updateSelectedPhoto
} from '../services/api'
import dayjs from 'dayjs'

function PhotoSelection() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
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
      setConfirmed(orderData.clientConfirm)

      const photoRes = await getSelectedPhotos({ orderId })
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

  const togglePhoto = async photo => {
    if (confirmed) return
    const newSelected = !photo.isSelected
    setPhotos(prev =>
      prev.map(p => p.id === photo.id ? { ...p, isSelected: newSelected } : p)
    )
    try {
      await updateSelectedPhoto(photo.id, { isSelected: newSelected })
    } catch (err) {
      console.error('更新照片状态失败:', err)
    }
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

    Modal.confirm({
      title: '确认选片',
      content: `您已选择 ${selectedCount} 张照片，确认提交后将通知摄影师开始修片。确定提交吗？`,
      onOk: async () => {
        setSubmitting(true)
        try {
          const selectedIds = photos.filter(p => p.isSelected).map(p => p.id)
          await confirmPhotoSelection(orderId, { photoIds: selectedIds })
          message.success('选片确认成功！摄影师将尽快为您修片')
          setConfirmed(true)
          loadData()
        } catch (err) {
          console.error(err)
          message.error('选片确认失败，请重试')
        } finally {
          setSubmitting(false)
        }
      }
    })
  }

  const handleAddMockPhotos = async () => {
    const count = addForm.getFieldValue('count') || 6
    const mockPhotos = []
    for (let i = 1; i <= count; i++) {
      mockPhotos.push({
        orderId: Number(orderId),
        photoUrl: `https://picsum.photos/600/400?random=${Date.now() + i}`,
        photoName: `原图_${String(i).padStart(3, '0')}.jpg`
      })
    }
    try {
      await createSelectedPhoto({ photos: mockPhotos })
      message.success(`成功添加 ${count} 张示例照片`)
      setAddModalVisible(false)
      addForm.resetFields()
      loadData()
    } catch (err) {
      console.error(err)
      message.error('添加照片失败')
    }
  }

  const selectedCount = photos.filter(p => p.isSelected).length

  if (orderError || !isNumericOrderId) {
    return (
      <div className="page-content">
        <div className="page-header">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>返回订单列表</Button>
            <h2 style={{ margin: 0 }}>选片确认</h2>
          </Space>
        </div>
        <Card>
          <Result
            status="warning"
            title="订单不存在"
            subTitle={`没有找到订单ID为 "${orderId}" 的订单，请从订单列表选择真实订单进入选片。`}
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
          <h2 style={{ margin: 0 }}>选片确认</h2>
          {confirmed && <Tag color="green" icon={<CheckOutlined />}>客户已确认</Tag>}
        </Space>
      </div>

      {confirmed ? (
        <Alert
          className="sync-error-tip"
          type="success"
          showIcon
          message="选片已确认"
          description="您已完成选片确认，摄影师将按照您选择的照片进行后期修片。您可以前往成片下载页面查看修片结果。"
          action={
            <Button size="small" type="primary" onClick={() => navigate(`/final-delivery/${orderId}`)}>
              前往成片下载
            </Button>
          }
        />
      ) : (
        <Alert
          className="sync-error-tip"
          type="info"
          showIcon
          message="请选择您喜欢的照片"
          description="点击照片进行选择，选好后点击「确认选片」按钮提交。您可以随时更改选择，确认提交后将无法修改。"
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
              <Statistic title="品牌" value={order.brand?.name || '-'} />
            </Col>
            <Col span={6}>
              <Statistic
                title="选片进度"
                value={`${selectedCount}/${photos.length}`}
                suffix="张"
                valueStyle={{ color: photos.length > 0 && selectedCount === photos.length ? '#52c41a' : '#1890ff' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {photos.length === 0 ? (
        <Card>
          <Empty
            image={<PictureOutlined style={{ fontSize: 48, color: '#ccc' }} />}
            description="暂无选片照片，选片数据准备中..."
          >
            <Space>
              <Button onClick={loadData} icon={<SyncOutlined />}>刷新</Button>
              <Button type="primary" onClick={() => setAddModalVisible(true)} icon={<PlusOutlined />}>
                添加示例照片
              </Button>
            </Space>
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
                已选择 <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{selectedCount}</span> 张 / 共 {photos.length} 张
              </span>
            </Space>
            <Space>
              <Button icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
                添加照片
              </Button>
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
                onClick={() => togglePhoto(photo)}
              >
                <div style={{ position: 'relative' }}>
                  <img src={photo.photoUrl} alt={photo.photoName} loading="lazy" />
                  {photo.isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#1890ff',
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
                  <div style={{ fontWeight: 500 }}>{photo.photoName}</div>
                  <div style={{ color: photo.isSelected ? '#1890ff' : '#999', fontSize: 11 }}>
                    {photo.isSelected ? '✓ 已选中' : '点击选择'}
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

      <Modal
        title="添加示例照片"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddMockPhotos}>
          <Form.Item name="count" label="照片数量" initialValue={6}>
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

export default PhotoSelection
