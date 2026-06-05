import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  Button,
  message,
  Space,
  Typography,
  Upload,
  Spin,
} from 'antd'
import {
  ScanOutlined,
  CameraOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { memberApi, coachApi, memberPackageApi, bookingApi, fileApi } from '../../api'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

export default function MobileBooking() {
  const [form] = Form.useForm()
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [offlineQueue, setOfflineQueue] = useState<any[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [coaches, setCoaches] = useState<any[]>([])
  const [memberPackages, setMemberPackages] = useState<any[]>([])
  const [loadingCoaches, setLoadingCoaches] = useState(false)
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadCoaches()

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const savedQueue = localStorage.getItem('offlineBookingQueue')
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineData()
    }
  }, [isOnline, offlineQueue])

  const loadCoaches = async () => {
    try {
      setLoadingCoaches(true)
      const data: any = await coachApi.listActive()
      setCoaches(data)
    } catch (error) {
      console.error('加载教练列表失败', error)
    } finally {
      setLoadingCoaches(false)
    }
  }

  const loadMemberPackages = async (memberId: number) => {
    try {
      setLoadingPackages(true)
      const data: any = await memberPackageApi.getByMember(memberId)
      setMemberPackages(data)
      if (data.length > 0) {
        form.setFieldsValue({ memberPackageId: data[0].id })
      }
    } catch (error) {
      console.error('加载会员课包失败', error)
      setMemberPackages([])
    } finally {
      setLoadingPackages(false)
    }
  }

  const syncOfflineData = async () => {
    message.loading({ content: '正在同步离线数据...', key: 'sync' })
    try {
      for (const data of offlineQueue) {
        await bookingApi.create(data)
      }
      setOfflineQueue([])
      localStorage.removeItem('offlineBookingQueue')
      message.success({ content: '同步成功', key: 'sync' })
    } catch (error) {
      message.error({ content: '同步失败，请稍后重试', key: 'sync' })
    }
  }

  const handleSearchMember = async () => {
    if (!searchKeyword.trim()) return
    try {
      const data: any = await memberApi.search(searchKeyword)
      setMemberInfo(data)
      form.setFieldsValue({ memberId: data.id })
      await loadMemberPackages(data.id)
      message.success('会员信息已加载')
    } catch (error) {
      message.error('未找到该会员')
      setMemberInfo(null)
      setMemberPackages([])
    }
  }

  const handleUpload: UploadProps['beforeUpload'] = async (file) => {
    try {
      const res: any = await fileApi.upload(file, 'body')
      message.success('照片上传成功')
      form.setFieldsValue({ photoUrl: res.url })
      return false
    } catch (error) {
      message.error('上传失败')
      return false
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const selectedPkg = memberPackages.find((p: any) => p.id === values.memberPackageId)
      if (!selectedPkg) {
        message.error('请选择有效的课包')
        return
      }

      const submitData = {
        memberId: values.memberId,
        coachId: values.coachId,
        memberPackageId: values.memberPackageId,
        courseType: 'PERSONAL',
        startTime: dayjs(values.date)
          .hour(values.time.hour())
          .minute(values.time.minute())
          .toISOString(),
        endTime: dayjs(values.date)
          .hour(values.time.hour() + 1)
          .minute(values.time.minute())
          .toISOString(),
        remark: values.remark,
      }

      if (!navigator.onLine) {
        const newQueue = [...offlineQueue, { ...submitData, offline: true, timestamp: Date.now() }]
        setOfflineQueue(newQueue)
        localStorage.setItem('offlineBookingQueue', JSON.stringify(newQueue))
        message.success('已保存到离线队列，联网后自动同步')
        form.resetFields()
        setMemberInfo(null)
        setMemberPackages([])
        setSearchKeyword('')
        setSubmitting(false)
        return
      }

      await bookingApi.create(submitData)
      message.success('预约成功')
      form.resetFields()
      setMemberInfo(null)
      setMemberPackages([])
      setSearchKeyword('')
    } catch (error: any) {
      message.error(error.message || '预约失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 16, background: '#f5f7fa', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ textAlign: 'center', margin: 0 }}>
          快速预约
        </Title>
        {!isOnline && (
          <div style={{ textAlign: 'center', color: '#faad14', marginTop: 8 }}>
            <Text type="warning">当前处于离线模式，数据将在联网后同步</Text>
            {offlineQueue.length > 0 && <div>待同步：{offlineQueue.length} 条</div>}
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Input
            placeholder="输入手机号/会员号或扫码"
            prefix={<ScanOutlined />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearchMember}
          />
          <Button type="primary" onClick={handleSearchMember}>
            查询
          </Button>
          <Button icon={<ScanOutlined />}>扫码</Button>
        </Space.Compact>

        {memberInfo && (
          <Card size="small" type="inner" style={{ marginBottom: 16, background: '#f0f5ff' }}>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>{memberInfo.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {memberInfo.memberNo} | 剩余 {memberInfo.totalRemainingSessions || 0} 节课
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  状态：{memberInfo.status === 'ACTIVE' ? '正常' : memberInfo.status === 'FROZEN' ? '已冻结' : memberInfo.status}
                </div>
              </div>
            </Space>
          </Card>
        )}
      </Card>

      <Card>
        <Form form={form} layout="vertical">
          <Form.Item name="memberId" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="date"
            label="预约日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d < dayjs().startOf('day')} />
          </Form.Item>

          <Form.Item
            name="time"
            label="预约时间"
            rules={[{ required: true, message: '请选择时间' }]}
          >
            <TimePicker
              style={{ width: '100%' }}
              format="HH:mm"
              minuteStep={30}
            />
          </Form.Item>

          <Form.Item
            name="coachId"
            label="选择教练"
            rules={[{ required: true, message: '请选择教练' }]}
          >
            <Select placeholder="请选择教练" loading={loadingCoaches}>
              {coaches.map((coach) => (
                <Option key={coach.id} value={coach.id}>
                  {coach.name} - {coach.level || '教练'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="memberPackageId"
            label="选择课包"
            rules={[{ required: true, message: '请选择课包' }]}
          >
            <Select
              placeholder={memberInfo ? '请选择课包' : '请先查询会员'}
              loading={loadingPackages}
              disabled={!memberInfo}
            >
              {memberPackages.map((pkg: any) => (
                <Option key={pkg.id} value={pkg.id}>
                  {pkg.coursePackage?.name || '课包'} - 剩余 {pkg.remainingSessions} 节
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选填备注信息" />
          </Form.Item>

          <Form.Item label="体测照片（可选）">
            <Upload beforeUpload={handleUpload} maxCount={3} listType="picture-card">
              <div>
                <CameraOutlined />
                <div style={{ marginTop: 8 }}>拍照/上传</div>
              </div>
            </Upload>
          </Form.Item>

          <Button type="primary" block size="large" onClick={handleSubmit} loading={submitting}>
            确认预约
          </Button>
        </Form>
      </Card>
    </div>
  )
}
