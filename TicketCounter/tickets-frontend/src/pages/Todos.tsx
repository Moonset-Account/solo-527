
import { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Input, Select, Button, Space, Modal, Form, Drawer, Badge,
  Typography, Tabs, Row, Col, Empty, DatePicker, message, Descriptions
} from 'antd'
import {
  SearchOutlined, CheckOutlined, EyeOutlined, PlusOutlined,
  ExclamationCircleFilled, SyncOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { todos, registrations } from '../services/http'
import {
  TodoItem, TodoStatus, TodoPriority, Registration,
  TODO_STATUS_LABEL, TODO_PRIORITY_LABEL
} from '../types'

const { Option } = Select
const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker

export default function Todos() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [status, setStatus] = useState<number | undefined>(undefined)
  const [priority, setPriority] = useState<number | undefined>(undefined)
  const [keyword, setKeyword] = useState<string>('')
  const [data, setData] = useState<any>({ totalCount: 0, items: [] })
  const [loading, setLoading] = useState(false)

  const [detail, setDetail] = useState<TodoItem | null>(null)
  const [regDetail, setRegDetail] = useState<Registration | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [resolveModal, setResolveModal] = useState<{ open: boolean; data?: TodoItem }>({ open: false })
  const [createForm] = Form.useForm()
  const [resolveForm] = Form.useForm()

  useEffect(() => { load() }, [page, pageSize, status, priority, keyword])

  const load = () => {
    setLoading(true)
    todos.query(page, pageSize, status, priority, keyword)
      .then(setData).finally(() => setLoading(false))
  }

  const openDetail = async (t: TodoItem) => {
    setDetail(t)
    if (t.relatedType === 'Registration' && t.relatedId) {
      registrations.getById(t.relatedId).then(r => setRegDetail(r)).catch(() => setRegDetail(null))
    } else setRegDetail(null)
  }

  const openResolve = (t: TodoItem) => {
    resolveForm.resetFields()
    setResolveModal({ open: true, data: t })
  }

  const submitResolve = async () => {
    try {
      const vals = await resolveForm.validateFields()
      if (!resolveModal.data) return
      await todos.resolve(resolveModal.data.id, vals)
      message.success('已处理')
      setResolveModal({ open: false })
      load()
      if (detail && detail.id === resolveModal.data.id) openDetail(detail)
    } catch { }
  }

  const submitCreate = async () => {
    try {
      const vals = await createForm.validateFields()
      await todos.create(vals)
      message.success('待办已创建')
      setCreateModal(false)
      createForm.resetFields()
      load()
    } catch { }
  }

  const countBy = (key: 'status' | 'priority', val: number) =>
    data.items.filter((t: TodoItem) => t[key] === val).length

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>资料缺失待办</h2>
          <p className="desc" style={{ margin: 0, marginTop: 4 }}>
            报名资料缺失自动生成待办，处理后同步刷新库存占用统计
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          新建待办
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input allowClear prefix={<SearchOutlined />} placeholder="搜索标题/描述"
              value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1) }} />
          </Col>
          <Col span={4}>
            <Select style={{ width: '100%' }} allowClear placeholder="状态" value={status}
              onChange={v => { setStatus(v); setPage(1) }}>
              {Object.entries(TODO_STATUS_LABEL).map(([k, v]) => (
                <Option key={k} value={Number(k)}>{v.text}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select style={{ width: '100%' }} allowClear placeholder="优先级" value={priority}
              onChange={v => { setPriority(v); setPage(1) }}>
              {Object.entries(TODO_PRIORITY_LABEL).map(([k, v]) => (
                <Option key={k} value={Number(k)}>{v.text}</Option>
              ))}
            </Select>
          </Col>
          <Col offset={10}>
            <Space>
              <Text type="secondary">共 {data.totalCount} 条</Text>
              <Button icon={<SyncOutlined />} onClick={load}>刷新</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={12} style={{ marginBottom: 12 }}>
        {Object.entries(TODO_STATUS_LABEL).map(([k, v]) => (
          <Col key={k} span={4}>
            <Badge.Ribbon text={v.text} color={v.color === 'warning' ? 'orange' : v.color === 'success' ? 'green' : v.color === 'processing' ? 'blue' : 'default'}>
              <Card size="small" style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{countBy('status', Number(k))}</div>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
        {Object.entries(TODO_PRIORITY_LABEL).map(([k, v]) => (
          <Col key={'p' + k} span={4}>
            <Badge.Ribbon text={'优先级 ' + v.text} color={v.color}>
              <Card size="small" style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{countBy('priority', Number(k))}</div>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>

      <div className="two-col">
        <Card title="待办列表" bodyStyle={{ padding: 0 }}>
          <Table<TodoItem>
            size="small" rowKey="id" loading={loading}
            dataSource={data.items as any}
            rowClassName={(r) => (r as TodoItem).affectsInventory ? 'row-affect' : ''}
            pagination={{
              current: page, pageSize, showSizeChanger: true, total: data.totalCount,
              onChange: (p, ps) => { setPage(p); setPageSize(ps) },
              showTotal: (t) => `共 ${t} 条`
            }}
            columns={[
              { title: '标题', dataIndex: 'title', ellipsis: true, width: 260,
                render: (v, r) => <a onClick={() => openDetail(r)}>{v}</a> },
              { title: '优先级', dataIndex: 'priority', width: 90,
                render: (p: TodoPriority) => <Tag color={TODO_PRIORITY_LABEL[p].color}>{TODO_PRIORITY_LABEL[p].text}</Tag> },
              { title: '状态', dataIndex: 'status', width: 100,
                render: (s: TodoStatus) => <Tag color={TODO_STATUS_LABEL[s].color}>{TODO_STATUS_LABEL[s].text}</Tag> },
              { title: '关联', width: 120,
                render: (_, r) => r.relatedType ? (
                  <Tag color={r.affectsInventory ? 'orange' : 'blue'}>
                    {r.relatedType === 'Registration' ? '报名' : r.relatedType}
                    {r.affectsInventory && ' · 影响库存'}
                  </Tag>
                ) : '-' },
              { title: '缺失字段', dataIndex: 'missingFields', width: 160, ellipsis: true,
                render: (v) => v ? <Text type="warning">{v}</Text> : '-' },
              { title: '截止', dataIndex: 'dueDate', width: 130,
                render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
              { title: '处理人', dataIndex: 'resolver', width: 90, render: (v) => v || '-' },
              { title: '创建', dataIndex: 'createdAt', width: 130, render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
              { title: '操作', width: 120, fixed: 'right',
                render: (_, r) => (
                  <Space size={4}>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
                    {r.status !== TodoStatus.Completed && (
                      <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openResolve(r)}>处理</Button>
                    )}
                  </Space>
                ) }
            ]} />
          <style>{`.row-affect { background: #fffbe6 !important; }`}</style>
        </Card>

        <Card title="待办详情">
          {!detail ? <Empty description="点击左侧待办查看详情" style={{ padding: 40 }} /> : (
            <Tabs defaultActiveKey="todo" size="small" items={[
              {
                key: 'todo', label: '待办内容',
                children: (
                  <div>
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="标题">{detail.title}</Descriptions.Item>
                      <Descriptions.Item label="描述" style={{ whiteSpace: 'pre-wrap' }}>{detail.description || '-'}</Descriptions.Item>
                      <Descriptions.Item label="优先级">
                        <Tag color={TODO_PRIORITY_LABEL[detail.priority].color}>{TODO_PRIORITY_LABEL[detail.priority].text}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="状态">
                        <Tag color={TODO_STATUS_LABEL[detail.status].color}>{TODO_STATUS_LABEL[detail.status].text}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="关联类型">{detail.relatedType || '-'}</Descriptions.Item>
                      <Descriptions.Item label="关联ID">{detail.relatedId || '-'}</Descriptions.Item>
                      <Descriptions.Item label="影响库存">
                        {detail.affectsInventory ? <Tag color="orange">是，待办解决后刷新</Tag> : '否'}
                      </Descriptions.Item>
                      <Descriptions.Item label="缺失字段">
                        {detail.missingFields ? <Text type="warning">{detail.missingFields}</Text> : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="指派给">{detail.assignedTo || '-'}</Descriptions.Item>
                      <Descriptions.Item label="截止日期">
                        {detail.dueDate ? dayjs(detail.dueDate).format('YYYY-MM-DD HH:mm') : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="处理人">{detail.resolver || '-'}</Descriptions.Item>
                      <Descriptions.Item label="处理时间">
                        {detail.resolvedAt ? dayjs(detail.resolvedAt).format('YYYY-MM-DD HH:mm') : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="处理结果">{detail.resolution || '-'}</Descriptions.Item>
                      <Descriptions.Item label="创建">{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')} by {detail.createdBy || '-'}</Descriptions.Item>
                    </Descriptions>
                    <div style={{ marginTop: 16 }}>
                      {detail.status !== TodoStatus.Completed && (
                        <Button type="primary" onClick={() => openResolve(detail)}>处理此待办</Button>
                      )}
                    </div>
                  </div>
                )
              },
              {
                key: 'related', label: '关联报名信息', disabled: detail.relatedType !== 'Registration',
                children: !regDetail ? <Empty description="无关联报名" /> : (
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="报名号">{regDetail.registrationNo}</Descriptions.Item>
                    <Descriptions.Item label="姓名">{regDetail.name}</Descriptions.Item>
                    <Descriptions.Item label="手机">{regDetail.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{regDetail.email || '-'}</Descriptions.Item>
                    <Descriptions.Item label="公司">{regDetail.company || '-'}</Descriptions.Item>
                    <Descriptions.Item label="职位">{regDetail.position || '-'}</Descriptions.Item>
                    <Descriptions.Item label="数据质量">
                      {regDetail.hasMissingData ? (
                        <Text type="warning">缺失 {regDetail.dataQualityScore}分：{regDetail.missingFields}</Text>
                      ) : (
                        <Text type="success">完整 {regDetail.dataQualityScore}分</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="当前场次">{regDetail.sessionName || '-'}</Descriptions.Item>
                    <Descriptions.Item label="状态">{regDetail.status}</Descriptions.Item>
                  </Descriptions>
                )
              }
            ]} />
          )}
        </Card>
      </div>

      <Modal title="新建待办" open={createModal} onOk={submitCreate} onCancel={() => { setCreateModal(false); createForm.resetFields() }}>
        <Form form={createForm} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="描述" name="description"><Input.TextArea rows={3} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="优先级" name="priority" initialValue={1}>
                <Select>
                  {Object.entries(TODO_PRIORITY_LABEL).map(([k, v]) => (
                    <Option key={k} value={Number(k)}>{v.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="截止" name="dueDate">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="关联类型" name="relatedType"><Input placeholder="Registration / ..." /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="指派给" name="assignedTo"><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item label="关联ID" name="relatedId"><Input /></Form.Item>
          <Form.Item label="缺失字段（逗号分隔）" name="missingFields"><Input /></Form.Item>
          <Form.Item label="影响库存" name="affectsInventory" valuePropName="checked" initialValue={false}>
            <Select>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={resolveModal.data ? `处理待办：${resolveModal.data.title}` : ''}
        open={resolveModal.open}
        onOk={submitResolve} onCancel={() => setResolveModal({ open: false })}>
        <Form form={resolveForm} layout="vertical">
          <Form.Item label="处理结果" name="status" rules={[{ required: true }]} initialValue={TodoStatus.Completed}>
            <Select>
              <Option value={TodoStatus.Completed}>完成</Option>
              <Option value={TodoStatus.Processing}>处理中</Option>
              <Option value={TodoStatus.Cancelled}>取消</Option>
            </Select>
          </Form.Item>
          <Form.Item label="处理说明" name="resolution" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请说明处理动作 / 补齐了哪些字段" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
