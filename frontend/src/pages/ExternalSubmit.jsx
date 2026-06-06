import React, { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Select, Button, Card, message, Steps, Result } from 'antd'
import { externalApi } from '../api'
const { TextArea } = Input

export default function ExternalSubmit() {
  const [step, setStep] = useState(0)
  const [clays, setClays] = useState([])
  const [glazes, setGlazes] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [artworkCode, setArtworkCode] = useState('')
  const [form] = Form.useForm()

  useEffect(() => {
    loadMasterData()
  }, [])

  const loadMasterData = async () => {
    try {
      const [clayData, glazeData] = await Promise.all([
        externalApi.getClays(),
        externalApi.getGlazes()
      ])
      setClays(clayData)
      setGlazes(glazeData)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (values) => {
    try {
      const result = await externalApi.submitArtwork(values)
      setArtworkCode(result.artworkCode)
      setSubmitted(true)
      message.success('提交成功！')
    } catch (e) {
      console.error(e)
    }
  }

  if (submitted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 24,
        background: '#f5f5f5'
      }}>
        <Card style={{ width: 500 }}>
          <Result
            status="success"
            title="作品提交成功！"
            subTitle={`作品编号: ${artworkCode}`}
            extra={[
              <Button type="primary" onClick={() => {
                setSubmitted(false)
                setStep(0)
                form.resetFields()
              }}>
                继续提交
              </Button>
            ]}
          />
          <div style={{ marginTop: 16, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
            <p><strong>说明：</strong></p>
            <p>1. 请记住您的作品编号，便于后续查询</p>
            <p>2. 工作人员会在1-2个工作日内审核您的作品</p>
            <p>3. 审核通过后会安排合适的窑次进行烧制</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '40px 24px',
      background: '#f5f5f5'
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Card title="作品提交" extra={<span style={{ color: '#999' }}>外部人员入口</span>}>
          <Steps current={step} size="small" style={{ marginBottom: 32 }}>
            <Steps.Step title="学员信息" />
            <Steps.Step title="作品信息" />
          </Steps>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {step === 0 && (
              <>
                <Form.Item 
                  name="studentName" 
                  label="姓名" 
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input placeholder="请输入您的姓名" />
                </Form.Item>
                <Form.Item 
                  name="studentPhone" 
                  label="手机号" 
                  rules={[{ required: true, message: '请输入手机号' }]}
                >
                  <Input placeholder="请输入手机号" />
                </Form.Item>
                <Form.Item name="studentEmail" label="邮箱">
                  <Input placeholder="请输入邮箱（选填）" />
                </Form.Item>
                <Button type="primary" onClick={() => form.validateFields(['studentName', 'studentPhone']).then(() => setStep(1))}>
                  下一步
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <Form.Item name="name" label="作品名称">
                  <Input placeholder="请输入作品名称（选填）" />
                </Form.Item>
                <Form.Item 
                  name="clayCode" 
                  label="泥料类型" 
                  rules={[{ required: true, message: '请选择泥料' }]}
                >
                  <Select placeholder="请选择泥料类型">
                    {clays.map(c => (
                      <Select.Option key={c.code} value={c.code}>
                        {c.name} ({c.temperatureZone === 'HIGH' ? '高温' : c.temperatureZone === 'MIDDLE' ? '中温' : '低温'})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="glazeCode" label="釉料类型">
                  <Select placeholder="请选择釉料类型（选填）" allowClear>
                    {glazes.map(g => (
                      <Select.Option key={g.code} value={g.code}>
                        {g.name} ({g.temperatureZone === 'HIGH' ? '高温' : g.temperatureZone === 'MIDDLE' ? '中温' : '低温'})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="weight" label="作品重量（kg）">
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="请输入重量（选填）" />
                </Form.Item>
                <Form.Item name="description" label="作品描述">
                  <TextArea rows={3} placeholder="请输入作品描述（选填）" />
                </Form.Item>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button onClick={() => setStep(0)}>上一步</Button>
                  <Button type="primary" htmlType="submit">提交</Button>
                </div>
              </>
            )}
          </Form>
        </Card>
      </div>
    </div>
  )
}
