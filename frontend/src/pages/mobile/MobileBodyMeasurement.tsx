import { useState, useEffect } from 'react'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Card,
  message,
  Modal,
  Tag,
  List,
  Image,
  Upload,
} from 'antd'
import {
  ScanOutlined,
  CameraOutlined,
  CloudSyncOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { memberApi, bodyMeasurementApi, attachmentApi, fileApi } from '../../api'
import dayjs from 'dayjs'

const { TextArea } = Input

interface OfflineQueueItem {
  id: string
  type: 'bodyMeasurement' | 'attachment'
  data: any
  status: 'pending' | 'syncing' | 'failed'
  error?: string
  createdAt: number
}

export default function MobileBodyMeasurement() {
  const [form] = Form.useForm()
  const [member, setMember] = useState<any>(null)
  const [scanModalVisible, setScanModalVisible] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([])
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const savedQueue = localStorage.getItem('offlineQueue')
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue))
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue))
  }, [offlineQueue])

  const handleScan = () => {
    setScanModalVisible(true)
  }

  const simulateScan = (memberNo: string) => {
    setScanModalVisible(false)
    if (!memberNo) {
      message.warning('请输入会员编号或手机号')
      return
    }
    searchMember(memberNo)
  }

  const searchMember = async (keyword: string) => {
    try {
      const data: any = await memberApi.search(keyword)
      setMember(data)
      form.setFieldsValue({
        memberName: data.name,
        memberPhone: data.phone,
        measureDate: dayjs().format('YYYY-MM-DD'),
      })
      message.success('已找到会员')
    } catch (error) {
      message.error('未找到会员')
    }
  }

  const handlePhotoUpload = async (file: File) => {
    try {
      if (!isOnline) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64 = e.target?.result as string
          setPhotos([...photos, base64])
          addToOfflineQueue('attachment', {
            fileName: file.name,
            filePath: base64,
            fileType: file.type,
            fileSize: file.size,
          })
        }
        reader.readAsDataURL(file)
        message.info('离线模式，照片已存入本地队列')
        return false
      }

      const data: any = await fileApi.upload(file, 'body-measurement')
      setPhotos([...photos, data.url || data.filePath])
      message.success('照片上传成功')
      return false
    } catch (error) {
      message.error('上传失败')
      return false
    }
  }

  const addToOfflineQueue = (type: 'bodyMeasurement' | 'attachment', data: any) => {
    const item: OfflineQueueItem = {
      id: `${type}-${Date.now()}`,
      type,
      data,
      status: 'pending',
      createdAt: Date.now(),
    }
    setOfflineQueue([...offlineQueue, item])
  }

  const saveMeasurement = async () => {
    try {
      const values = await form.validateFields()

      const measurementData = {
        memberId: member?.id,
        measureDate: values.measureDate,
        height: values.height,
        weight: values.weight,
        bmi: values.bmi,
        bodyFatRate: values.bodyFatRate,
        muscleMass: values.muscleMass,
        waist: values.waist,
        hip: values.hip,
        chest: values.chest,
        leftArm: values.leftArm,
        rightArm: values.rightArm,
        leftThigh: values.leftThigh,
        rightThigh: values.rightThigh,
        basalMetabolism: values.basalMetabolism,
        photos: photos.join(','),
        note: values.note,
      }

      if (!isOnline) {
        addToOfflineQueue('bodyMeasurement', measurementData)
        message.success('离线模式，体测记录已存入本地队列')
        form.resetFields()
        setMember(null)
        setPhotos([])
        return
      }

      setSaving(true)
      const savedMeasurement: any = await bodyMeasurementApi.create(measurementData)

      for (const photoUrl of photos) {
        await attachmentApi.create({
          fileName: `photo-${Date.now()}.jpg`,
          originalFileName: '体测照片',
          filePath: photoUrl,
          fileType: 'image/jpeg',
          relatedType: 'BODY_MEASUREMENT',
          relatedId: savedMeasurement.id,
          uploadStatus: 'SUCCESS',
        })
      }

      message.success('体测记录保存成功')
      form.resetFields()
      setMember(null)
      setPhotos([])
    } catch (error) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const syncOfflineQueue = async () => {
    if (!isOnline) {
      message.warning('当前离线，无法同步')
      return
    }

    setSyncing(true)
    const pendingItems = offlineQueue.filter((item) => item.status === 'pending')
    let successCount = 0

    for (const item of pendingItems) {
      try {
        setOfflineQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'syncing' } : i))
        )

        if (item.type === 'bodyMeasurement') {
          await bodyMeasurementApi.create(item.data)
        } else if (item.type === 'attachment') {
          await attachmentApi.create(item.data)
        }

        setOfflineQueue((prev) => prev.filter((i) => i.id !== item.id))
        successCount++
      } catch (error: any) {
        setOfflineQueue((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'failed', error: error.message } : i
          )
        )
      }
    }

    setSyncing(false)
    if (successCount > 0) {
      message.success(`成功同步 ${successCount} 条记录`)
    } else {
      message.info('没有需要同步的记录')
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      <Card
        title="体测记录"
        extra={
          <Tag color={isOnline ? 'green' : 'orange'}>
            {isOnline ? '在线' : '离线'}
            {offlineQueue.length > 0 && ` (${offlineQueue.length}待同步)`}
          </Tag>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<ScanOutlined />}
            onClick={handleScan}
            style={{ width: '100%', height: 48, fontSize: 16 }}
          >
            扫码录入会员
          </Button>
        </div>

        {member && (
          <Card
            size="small"
            style={{ marginBottom: 16, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <UserOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>{member.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {member.phone} | {member.memberNo}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Form form={form} layout="vertical">
          <Form.Item name="memberName" label="会员姓名">
            <Input readOnly placeholder="请先扫码或搜索会员" />
          </Form.Item>

          <Form.Item name="measureDate" label="测量日期" initialValue={dayjs().format('YYYY-MM-DD')}>
            <Input readOnly />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Form.Item name="height" label="身高(cm)">
              <InputNumber min={0} max={300} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="weight" label="体重(kg)">
              <InputNumber min={0} max={500} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Form.Item name="bmi" label="BMI">
              <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="bodyFatRate" label="体脂率(%)">
              <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Form.Item name="muscleMass" label="肌肉量(kg)">
              <InputNumber min={0} max={200} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="basalMetabolism" label="基础代谢">
              <InputNumber min={0} max={10000} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Form.Item name="waist" label="腰围(cm)">
              <InputNumber min={0} max={300} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="hip" label="臀围(cm)">
              <InputNumber min={0} max={300} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="chest" label="胸围(cm)">
              <InputNumber min={0} max={300} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Form.Item name="leftArm" label="左臂(cm)">
              <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="rightArm" label="右臂(cm)">
              <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Form.Item name="leftThigh" label="左大腿(cm)">
              <InputNumber min={0} max={200} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="rightThigh" label="右大腿(cm)">
              <InputNumber min={0} max={200} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item label="体测照片">
            <Upload
              listType="picture-card"
              beforeUpload={handlePhotoUpload}
              accept="image/*"
              multiple
            >
              <div>
                <CameraOutlined style={{ fontSize: 24 }} />
                <div style={{ marginTop: 8 }}>拍照</div>
              </div>
            </Upload>
            {photos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {photos.map((photo, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <Image width={80} height={80} src={photo} style={{ objectFit: 'cover', borderRadius: 4 }} />
                    <Button
                      type="text"
                      danger
                      size="small"
                      style={{ position: 'absolute', top: -8, right: -8, padding: 0, minWidth: 20, height: 20 }}
                      onClick={() => removePhoto(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Form.Item>

          <Form.Item name="note" label="备注">
            <TextArea rows={2} placeholder="输入备注信息" />
          </Form.Item>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={saveMeasurement}
            loading={saving}
            disabled={!member}
            style={{ width: '100%', height: 48, fontSize: 16, marginBottom: 12 }}
          >
            保存体测记录
          </Button>

          {offlineQueue.length > 0 && (
            <Button
              icon={<CloudSyncOutlined />}
              onClick={syncOfflineQueue}
              loading={syncing}
              disabled={!isOnline}
              style={{ width: '100%' }}
            >
              同步离线队列 ({offlineQueue.length}条)
            </Button>
          )}
        </Form>

        {offlineQueue.length > 0 && (
          <Card title="离线队列" size="small" style={{ marginTop: 16 }}>
            <List
              size="small"
              dataSource={offlineQueue}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.type === 'bodyMeasurement' ? '体测记录' : '附件'}
                    description={
                      <>
                        <Tag color={item.status === 'pending' ? 'orange' : item.status === 'syncing' ? 'blue' : 'red'}>
                          {item.status === 'pending' ? '待同步' : item.status === 'syncing' ? '同步中' : '失败'}
                        </Tag>
                        {dayjs(item.createdAt).format('MM-DD HH:mm')}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </Card>

      <Modal
        title="扫码录入会员"
        open={scanModalVisible}
        onCancel={() => setScanModalVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center' }}>
          <ScanOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
          <p>请扫描会员二维码或输入会员编号/手机号</p>
          <Input.Search
            placeholder="输入会员编号或手机号"
            enterButton="确认"
            size="large"
            onSearch={simulateScan}
            style={{ marginBottom: 16 }}
          />
          <Button block onClick={() => simulateScan('M001')}>
            模拟扫码: 会员M001
          </Button>
        </div>
      </Modal>
    </div>
  )
}
