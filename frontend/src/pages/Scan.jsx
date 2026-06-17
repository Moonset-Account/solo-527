import React, { useState, useEffect, useRef } from 'react'
import { Card, Form, Input, Button, Tag, Space, App, Steps, InputNumber, Divider } from 'antd'
import { ScanOutlined, PlayCircleOutlined, CheckCircleOutlined, QrcodeOutlined } from '@ant-design/icons'
import { Html5Qrcode } from 'html5-qrcode'
import dayjs from 'dayjs'
import { equipmentApi, processFlowApi } from '../services/api'

const { Step } = Steps
const { TextArea } = Input

const Scan = () => {
  const [scanning, setScanning] = useState(false)
  const [equipment, setEquipment] = useState(null)
  const [currentProcess, setCurrentProcess] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [manualQrCode, setManualQrCode] = useState('')
  const scannerRef = useRef(null)
  const { message, modal } = App.useApp()

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [])

  const startScanner = async () => {
    try {
      setScanning(true)
      scannerRef.current = new Html5Qrcode('qr-reader')
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      )
    } catch (error) {
      message.error('启动摄像头失败，请手动输入二维码')
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (e) {}
    }
    setScanning(false)
  }

  const onScanSuccess = async (decodedText) => {
    await stopScanner()
    fetchEquipmentByQRCode(decodedText)
  }

  const fetchEquipmentByQRCode = async (qrCode) => {
    try {
      setLoading(true)
      const response = await equipmentApi.getByQRCode(qrCode)
      if (response.code === 200) {
        setEquipment(response.data)
        const flows = response.data.currentPlan?.processFlows || []
        const pending = flows.find((f) => f.status === 'PENDING' || f.status === 'IN_PROGRESS')
        setCurrentProcess(pending || null)
        form.resetFields()
      } else {
        message.error(response.message)
      }
    } catch (error) {
      message.error('获取设备信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleManualInput = () => {
    if (!manualQrCode.trim()) {
      message.warning('请输入二维码内容')
      return
    }
    fetchEquipmentByQRCode(manualQrCode.trim())
  }

  const handleProcessAction = async (action) => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const response = await processFlowApi.scan({
        qrCode: equipment?.qrCode,
        processFlowId: currentProcess?.id,
        action,
        ...values,
      })

      if (response.code === 200) {
        message.success(response.message)
        fetchEquipmentByQRCode(equipment.qrCode)
      } else {
        message.error(response.message)
      }
    } catch (error) {
      if (error.errorFields) return
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    modal.confirm({
      title: '确认开始工序',
      content: `确定要开始【${currentProcess?.process?.name}】工序吗？`,
      onOk: () => handleProcessAction('START'),
    })
  }

  const handleComplete = () => {
    modal.confirm({
      title: '确认完成工序',
      content: `确定要完成【${currentProcess?.process?.name}】工序吗？`,
      onOk: () => handleProcessAction('COMPLETE'),
    })
  }

  const reset = () => {
    setEquipment(null)
    setCurrentProcess(null)
    setManualQrCode('')
    form.resetFields()
  }

  const statusColor = (status) => {
    const colors = {
      IDLE: 'default',
      RUNNING: 'success',
      MAINTENANCE: 'warning',
      ERROR: 'error',
    }
    return colors[status] || 'default'
  }

  const statusText = (status) => {
    const texts = {
      IDLE: '空闲',
      RUNNING: '运行中',
      MAINTENANCE: '维护中',
      ERROR: '故障',
    }
    return texts[status] || status
  }

  const processStatusColor = (status) => {
    const colors = {
      PENDING: 'default',
      IN_PROGRESS: 'processing',
      COMPLETED: 'success',
      REWORK: 'error',
      SKIPPED: 'default',
    }
    return colors[status] || 'default'
  }

  const processStatusText = (status) => {
    const texts = {
      PENDING: '待开始',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      REWORK: '返工',
      SKIPPED: '已跳过',
    }
    return texts[status] || status
  }

  return (
    <div className="scan-container">
      <div className="page-header">
        <h1 className="page-title">扫码流转</h1>
        <Button onClick={reset}>重新扫码</Button>
      </div>

      {!equipment ? (
        <Card loading={loading}>
          {!scanning ? (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ textAlign: 'center' }}>
                <QrcodeOutlined style={{ fontSize: 64, color: '#1677ff', marginBottom: 16 }} />
                <p style={{ color: '#666', marginBottom: 16 }}>扫描设备二维码开始工序流转</p>
                <Button type="primary" size="large" icon={<ScanOutlined />} onClick={startScanner}>
                  打开摄像头扫码
                </Button>
              </div>

              <Divider>或手动输入</Divider>

              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="请输入二维码内容"
                  value={manualQrCode}
                  onChange={(e) => setManualQrCode(e.target.value)}
                  onPressEnter={handleManualInput}
                />
                <Button type="primary" onClick={handleManualInput}>
                  确认
                </Button>
              </Space.Compact>

              <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
                  <strong>测试二维码：</strong>
                  <br />
                  EQ-INJ-001（注塑机1号）
                  <br />
                  EQ-INJ-002（注塑机2号）
                  <br />
                  EQ-INJ-003（注塑机3号）
                </p>
              </div>
            </Space>
          ) : (
            <div>
              <div id="qr-reader" className="scan-reader" style={{ marginBottom: 16 }} />
              <Button block onClick={stopScanner}>
                取消扫码
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card loading={loading}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <h3 style={{ marginBottom: 8 }}>
                {equipment.name}
                <Tag color={statusColor(equipment.status)} style={{ marginLeft: 8 }}>
                  {statusText(equipment.status)}
                </Tag>
              </h3>
              <p style={{ margin: 0, color: '#666' }}>
                设备编码：{equipment.code} | 位置：{equipment.location || '未设置'}
              </p>
            </div>

            {equipment.currentPlan ? (
              <div>
                <Divider orientation="left">当前生产计划</Divider>
                <p style={{ marginBottom: 8 }}>
                  <strong>计划编号：</strong>
                  {equipment.currentPlan.planNo}
                </p>
                <p style={{ marginBottom: 16 }}>
                  <strong>产品：</strong>
                  {equipment.currentPlan.workOrder?.productName}（
                  {equipment.currentPlan.workOrder?.orderNo}）
                </p>

                <Divider orientation="left">工序流程</Divider>
                <Steps
                  direction="vertical"
                  size="small"
                  current={
                    equipment.currentPlan.processFlows.findIndex(
                      (f) => f.status === 'PENDING' || f.status === 'IN_PROGRESS'
                    ) + 1
                  }
                  status={
                    currentProcess?.status === 'REWORK' ? 'error' : 'process'
                  }
                >
                  {equipment.currentPlan.processFlows.map((flow) => (
                    <Step
                      key={flow.id}
                      title={
                        <Space>
                          {flow.process?.name}
                          <Tag color={processStatusColor(flow.status)} size="small">
                            {processStatusText(flow.status)}
                          </Tag>
                        </Space>
                      }
                      description={
                        flow.startTime
                          ? `${dayjs(flow.startTime).format('HH:mm')} ~ ${
                              flow.endTime ? dayjs(flow.endTime).format('HH:mm') : '进行中'
                            }`
                          : '待开始'
                      }
                    />
                  ))}
                </Steps>

                {currentProcess && (
                  <>
                    <Divider />
                    <Card
                      size="small"
                      title={
                        <Space>
                          {currentProcess.status === 'IN_PROGRESS' ? (
                            <CheckCircleOutlined style={{ color: '#1890ff' }} />
                          ) : (
                            <PlayCircleOutlined style={{ color: '#52c41a' }} />
                          )}
                          <span>
                            {currentProcess.status === 'IN_PROGRESS'
                              ? '完成工序'
                              : '开始工序'}
                            ：{currentProcess.process?.name}
                          </span>
                        </Space>
                      }
                      type={currentProcess.status === 'IN_PROGRESS' ? 'inner' : 'default'}
                    >
                      <Form form={form} layout="vertical">
                        {currentProcess.status === 'PENDING' && (
                          <Form.Item
                            name="operator"
                            label="操作员"
                            rules={[{ required: true, message: '请输入操作员姓名' }]}
                          >
                            <Input placeholder="请输入操作员姓名" />
                          </Form.Item>
                        )}

                        {currentProcess.status === 'IN_PROGRESS' && (
                          <>
                            <Form.Item
                              name="outputQuantity"
                              label="合格数量"
                              rules={[{ required: true, message: '请输入合格数量' }]}
                            >
                              <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                placeholder="请输入合格数量"
                              />
                            </Form.Item>
                            <Form.Item
                              name="defectQuantity"
                              label="不良数量"
                              initialValue={0}
                            >
                              <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                placeholder="请输入不良数量"
                              />
                            </Form.Item>
                            <Form.Item name="remark" label="备注">
                              <TextArea rows={2} placeholder="请输入备注信息（可选）" />
                            </Form.Item>
                          </>
                        )}

                        <Form.Item style={{ marginBottom: 0 }}>
                          {currentProcess.status === 'PENDING' ? (
                            <Button
                              type="primary"
                              block
                              icon={<PlayCircleOutlined />}
                              onClick={handleStart}
                            >
                              开始工序
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              block
                              icon={<CheckCircleOutlined />}
                              onClick={handleComplete}
                            >
                              完成工序
                            </Button>
                          )}
                        </Form.Item>
                      </Form>
                    </Card>
                  </>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                该设备当前没有安排生产计划
              </div>
            )}
          </Space>
        </Card>
      )}
    </div>
  )
}

export default Scan
