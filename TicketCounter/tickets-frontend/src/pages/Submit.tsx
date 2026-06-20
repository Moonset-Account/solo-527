
import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Card, Steps, Result, message, Space, Alert, Progress, Row, Col } from 'antd'
import { UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined, BankOutlined } from '@ant-design/icons'
import { registrations, sessions, ticketStock } from '../services/http'
import { Session, TicketType, TICKET_TYPE_LABEL, SESSION_STATUS_LABEL } from '../types'
import { SessionStatus } from '../types'

const { TextArea } = Input
const { Option } = Select

const FIELDS_REQUIRED: Record<string, string> = {
  name: '姓名',
  phone: '手机号',
  company: '公司',
  position: '职位',
  email: '邮箱',
  sessionId: '场次',
  ticketType: '票种',
  idCard: '身份证'
}

export default function Submit() {
  const [form] = Form.useForm()
  const [step, setStep] = useState(0)
  const [sessionList, setSessionList] = useState<Session[]>([])
  const [ticketList, setTicketList] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [qualityScore, setQualityScore] = useState(100)
  const [missingFields, setMissingFields] = useState<string[]>([])

  useEffect(() => {
    sessions.getAll().then((data: any) => {
      setSessionList(data.filter((s: Session) => s.status !== SessionStatus.Draft && s.status !== SessionStatus.Cancelled && s.status !== SessionStatus.Ended))
    })
    form.setFieldsValue({ source: 0 })
  }, [form])

  useEffect(() => {
    const subs = form.values$ ? form.values$ : null
    if (subs) {
      const sub = subs.subscribe((vals: any) => calcQuality(vals))
      return () => sub.unsubscribe()
    }
  }, [form])

  const calcQuality = (vals: any) => {
    const missing: string[] = []
    let score = 100
    const weights: Record<string, number> = { name: 20, phone: 20, company: 10, position: 10, email: 10, sessionId: 10, ticketType: 10, idCard: 10 }
    Object.entries(weights).forEach(([k, w]) => {
      const v = vals?.[k]
      if (v === undefined || v === null || v === '' || v === 0) {
        score -= w
        missing.push(FIELDS_REQUIRED[k])
      }
    })
    setQualityScore(Math.max(0, score))
    setMissingFields(missing)
  }

  const onSessionChange = (sid: string) => {
    ticketStock.getBySession(sid).then(setTicketList)
    calcQuality({ ...form.getFieldsValue(), sessionId: sid })
  }

  const onValuesChange = (_c: any, all: any) => {
    calcQuality(all)
  }

  const handleSubmit = async () => {
    try {
      const vals = await form.validateFields()
      setStep(1)
      try {
        const reg = await registrations.submit(vals)
        setResult(reg)
        setStep(2)
        message.success('报名提交成功')
      } catch (e) {
        setStep(0)
      }
    } catch {
      message.warning('请完善必填字段')
    }
  }

  if (step === 2) {
    return (
      <div className="page-container">
        <Result status="success"
          title="报名提交成功"
          subTitle={
            <div>
              <div>报名号：<strong>{result?.registrationNo}</strong></div>
              {missingFields.length > 0 && (
                <Alert type="warning" style={{ marginTop: 12, textAlign: 'left' }}
                  message="资料待完善"
                  description={
                    <div>
                      <div>以下字段缺失，已生成待办并同步到库存占用：</div>
                      <div>{missingFields.map(f => <span key={f} style={{ marginRight: 12 }}>• {f}</span>)}</div>
                      <div style={{ marginTop: 8 }}>请后续在"资料缺失待办"中补充完善。</div>
                    </div>
                  } />
              )}
            </div>
          }
          extra={[
            <Button key="reset" onClick={() => { form.resetFields(); setResult(null); setStep(0) }}>继续报名</Button>
          ]} />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>提交报名资料</h2>
        <p className="desc">填写参会人员信息，缺失字段将生成待办并同步到库存占用统计</p>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="报名信息" style={{ marginBottom: 16 }}>
            <Steps current={step} size="small" style={{ marginBottom: 24 }}
              items={[
                { title: '填写资料', description: missingFields.length > 0 ? `${missingFields.length}项待补` : '完整' },
                { title: '提交中' },
                { title: '完成' }
              ]} />
            <Form form={form} layout="vertical" onValuesChange={onValuesChange} onFinish={handleSubmit}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="场次" name="sessionId" rules={[{ required: true, message: '请选择场次' }]}>
                    <Select placeholder="选择场次（含分组赛程）" onChange={onSessionChange}
                      optionFilterProp="children" showSearch>
                      {sessionList.map(s => (
                        <Option key={s.id} value={s.id}>
                          {s.name} {s.groupNumber && `(第${s.groupNumber}组)`} - {new Date(s.startTime).toLocaleDateString()}
                          <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                            座位 {s.soldSeatCount}/{s.seatCount}
                          </span>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="票种" name="ticketType">
                    <Select placeholder="选择票种" showSearch optionFilterProp="children">
                      {ticketList.length > 0 ? ticketList.map((t: any) => (
                        <Option key={t.ticketType} value={t.ticketType}>
                          {TICKET_TYPE_LABEL[t.ticketType as TicketType]} - 剩{t.availableQuantity}张
                          {t.price && ` (¥${t.price})`}
                        </Option>
                      )) : Object.entries(TICKET_TYPE_LABEL).map(([k, v]) => (
                        <Option key={k} value={Number(k)}>{v}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                    <Input prefix={<UserOutlined />} placeholder="参会人员姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
                    <Input prefix={<PhoneOutlined />} placeholder="接收通知用" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="公司" name="company">
                    <Input prefix={<BankOutlined />} placeholder="所属公司" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="职位" name="position">
                    <Input placeholder="职务/岗位" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="邮箱" name="email">
                    <Input prefix={<MailOutlined />} placeholder="电子信箱" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="身份证号" name="idCard">
                    <Input placeholder="实名制核验" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="微信" name="wechat">
                    <Input placeholder="微信号" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="所在城市" name="city">
                    <Input prefix={<HomeOutlined />} placeholder="城市" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="所属行业" name="industry">
                    <Input placeholder="行业领域" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="报名来源" name="source">
                    <Select>
                      <Option value={0}>线上官网</Option>
                      <Option value={1}>线下登记</Option>
                      <Option value={2}>定向邀请</Option>
                      <Option value={3}>合作伙伴</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="备注" name="remark">
                <TextArea rows={3} placeholder="分组/特殊需求/饮食偏好等" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" size="large" htmlType="submit" loading={step === 1}>
                    提交报名
                  </Button>
                  <Button size="large" onClick={() => form.resetFields()}>重置</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="资料完整度" style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <Progress type="dashboard" percent={qualityScore}
                status={qualityScore < 60 ? 'exception' : qualityScore >= 80 ? 'success' : 'normal'} />
              <div style={{ marginTop: 12, color: '#666' }}>
                {qualityScore === 100 ? '资料完整，审核优先处理' :
                  qualityScore >= 80 ? '基本完整' :
                    qualityScore >= 60 ? '资料不完整，需要补充' :
                      '资料严重缺失，需要尽快补充'}
              </div>
            </div>
            {missingFields.length > 0 && (
              <Alert type="warning" style={{ marginTop: 16 }} showIcon
                message={`${missingFields.length} 项字段缺失`}
                description={
                  <div>
                    {missingFields.map(f => <div key={f}>• {f}</div>)}
                    <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                      缺失将生成待办，并在库存中以"缺失资料占用"统计
                    </div>
                  </div>
                } />
            )}
          </Card>
          <Card title="温馨提示">
            <ul style={{ paddingLeft: 20, color: '#666', lineHeight: 2 }}>
              <li>请尽量提供完整信息，方便后续联络与分组</li>
              <li>手机号与邮箱用于接收日程、核销凭证</li>
              <li>提交后仍可在后台"资料缺失待办"中更新</li>
              <li>报名审核通过后将锁定对应座位</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
