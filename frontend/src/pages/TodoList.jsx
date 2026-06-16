
import { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  List,
  Tag,
  Button,
  Space,
  Table,
  Descriptions,
  Badge,
  Avatar,
  Input,
  Select,
  Form,
  Modal,
  message,
  Statistic,
  Spin
} from 'antd'
import {
  ToDoOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  PhoneOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { getTodoItems, getTodoItem, completeTodoItem, getPendingTodoCount } from '../services/api'

const { Option } = Select
const { TextArea } = Input

const priorityColorMap = { 4: '#f5222d', 3: '#fa8c16', 2: '#1890ff', 1: '#52c41a' }
const statusColorMap = { 1: 'gold', 2: 'blue', 3: 'green', 4: 'default' }

const TodoList = () => {
  const [todoList, setTodoList] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [completeModalVisible, setCompleteModalVisible] = useState(false)
  const [completeForm] = Form.useForm()
  const [pendingCount, setPendingCount] = useState(0)

  const fetchTodoList = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const params = {
        pageIndex: page,
        pageSize,
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterType !== 'all' && { type: filterType })
      }
      const res = await getTodoItems(params)
      const data = res.data
      setTodoList(data.items || [])
      setPagination({ current: page, pageSize, total: data.total || 0 })
    } catch {
      setTodoList([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingCount = async () => {
    try {
      const res = await getPendingTodoCount()
      setPendingCount(res.data || 0)
    } catch {}
  }

  useEffect(() => {
    fetchTodoList()
    fetchPendingCount()
  }, [filterStatus, filterType])

  const handleSelectTodo = async (id) => {
    setSelectedId(id)
    setDetailLoading(true)
    try {
      const res = await getTodoItem(id, true)
      setDetail(res.data)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleComplete = async () => {
    try {
      await completeForm.validateFields()
      await completeTodoItem(selectedId)
      message.success('办结成功！已同步到排班负荷报表')
      setCompleteModalVisible(false)
      completeForm.resetFields()
      fetchTodoList(pagination.current, pagination.pageSize)
      fetchPendingCount()
      handleSelectTodo(selectedId)
    } catch {}
  }

  const getPriorityColor = (priority) => priorityColorMap[priority] || '#1890ff'
  const getStatusColor = (status) => statusColorMap[status] || 'default'

  const feeColumns = [
    {
      title: '项目名称',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text, record) => (
        <Space>
          {record.status === 1 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <ClockCircleOutlined style={{ color: '#faad14' }} />}
          {text}
        </Space>
      )
    },
    { title: '类别', dataIndex: 'categoryText', key: 'categoryText', width: 100 },
    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => `¥${v.toFixed(2)}`, width: 90, align: 'right' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 60, align: 'center' },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v) => `¥${v.toFixed(2)}`,
      width: 100,
      align: 'right'
    },
    {
      title: '状态',
      dataIndex: 'statusText',
      key: 'statusText',
      render: (text, record) => (
        <Tag color={record.status === 1 ? 'green' : 'gold'}>{text}</Tag>
      ),
      width: 80
    }
  ]

  const prescriptionColumns = [
    { title: '药品名称', dataIndex: 'medicineName', key: 'medicineName' },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 120 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 60, align: 'center' },
    { title: '用法', dataIndex: 'usage', key: 'usage', width: 150 },
    { title: '剂量', dataIndex: 'dosage', key: 'dosage', width: 100 },
    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => `¥${v.toFixed(2)}`, width: 80, align: 'right' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v.toFixed(2)}`, width: 90, align: 'right' }
  ]

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card
            title={
              <Space>
                <span>待办事项</span>
                {pendingCount > 0 && <Badge count={pendingCount} style={{ backgroundColor: '#fa8c16' }} />}
              </Space>
            }
            size="small"
            extra={
              <Space size="small">
                <Select
                  size="small"
                  value={filterType}
                  onChange={setFilterType}
                  style={{ width: 90 }}
                >
                  <Option value="all">全部类型</Option>
                  <Option value={1}>随访</Option>
                  <Option value={2}>收费</Option>
                  <Option value={3}>处方</Option>
                  <Option value={4}>检查</Option>
                  <Option value={99}>其他</Option>
                </Select>
                <Select
                  size="small"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: 90 }}
                >
                  <Option value="all">全部状态</Option>
                  <Option value={1}>待处理</Option>
                  <Option value={2}>进行中</Option>
                  <Option value={3}>已完成</Option>
                  <Option value={4}>已取消</Option>
                </Select>
              </Space>
            }
            style={{ height: 'calc(100vh - 140px)', overflow: 'hidden' }}
            bodyStyle={{ height: '100%', overflow: 'auto', padding: 0 }}
          >
            <List
              loading={loading}
              dataSource={todoList}
              renderItem={item => (
                <List.Item
                  key={item.id}
                  onClick={() => handleSelectTodo(item.id)}
                  style={{
                    cursor: 'pointer',
                    padding: '12px 16px',
                    borderLeft: selectedId === item.id ? '3px solid #13c2c2' : '3px solid transparent',
                    backgroundColor: selectedId === item.id ? '#e6fffb' : undefined
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge dot color={getPriorityColor(item.priority)}>
                        <Avatar icon={<ToDoOutlined />} style={{ backgroundColor: item.status === 3 ? '#52c41a' : '#13c2c2' }} />
                      </Badge>
                    }
                    title={
                      <Space>
                        <span style={{ fontWeight: 500 }}>{item.title}</span>
                        <Tag size="small" color={getStatusColor(item.status)}>{item.statusText}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Space size="small">
                          <Tag size="small" color="blue">{item.typeText}</Tag>
                          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                            优先级：{item.priorityText}
                          </span>
                        </Space>
                        <Space size="small">
                          <UserOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                          <span style={{ fontSize: 12, color: '#595959' }}>{item.patientName}</span>
                          <PhoneOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                          <span style={{ fontSize: 12, color: '#595959' }}>{item.patientPhone}</span>
                        </Space>
                        <div style={{ fontSize: 12, color: item.status === 3 ? '#52c41a' : '#faad14' }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          截止：{item.dueDateText || item.dueDate}
                        </div>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={16}>
          {selectedId ? (
            <Spin spinning={detailLoading}>
              {detail ? (
                <Card
                  title={
                    <Space>
                      <span>{detail.title}</span>
                      <Tag color={getStatusColor(detail.status)}>{detail.statusText}</Tag>
                      {detail.followUp?.isOverdue && <Tag color="red" icon={<ExclamationCircleOutlined />}>已逾期</Tag>}
                    </Space>
                  }
                  size="small"
                  extra={
                    detail.status !== 3 && (
                      <Space>
                        <Button size="small">转派</Button>
                        <Button type="primary" size="small" onClick={() => setCompleteModalVisible(true)}>
                          办结
                        </Button>
                      </Space>
                    )
                  }
                  style={{ height: 'calc(100vh - 140px)', overflow: 'hidden' }}
                  bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
                >
                  <Descriptions size="small" column={3} style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="患者">{detail.patientName}</Descriptions.Item>
                    <Descriptions.Item label="手机号">{detail.patientPhone}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{detail.createdAt}</Descriptions.Item>
                    <Descriptions.Item label="截止时间">
                      <span style={{ color: detail.status === 3 ? '#52c41a' : '#f5222d' }}>
                        {detail.dueDateText || detail.dueDate}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="类型">
                      <Tag>{detail.typeText}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="优先级">
                      <Tag color={getPriorityColor(detail.priority)}>{detail.priorityText}</Tag>
                    </Descriptions.Item>
                    {detail.assignedToUserName && (
                      <Descriptions.Item label="负责人">{detail.assignedToUserName}</Descriptions.Item>
                    )}
                    {detail.completedAt && (
                      <Descriptions.Item label="完成时间">{detail.completedAt}</Descriptions.Item>
                    )}
                  </Descriptions>

                  <Card type="inner" size="small" title="任务描述" style={{ marginBottom: 12 }}>
                    {detail.description}
                  </Card>

                  {detail.followUp && (
                    <Card
                      type="inner"
                      size="small"
                      title={
                        <Space>
                          <ClockCircleOutlined style={{ color: '#13c2c2' }} />
                          <span>随访信息</span>
                          {detail.followUp.isOverdue && <Tag color="red" icon={<ExclamationCircleOutlined />}>已逾期</Tag>}
                        </Space>
                      }
                      style={{ marginBottom: 12 }}
                    >
                      <Descriptions column={2} size="small" bordered>
                        <Descriptions.Item label="随访类型">{detail.followUp.typeText}</Descriptions.Item>
                        <Descriptions.Item label="计划日期">{detail.followUp.plannedDateText || detail.followUp.plannedDate}</Descriptions.Item>
                        {detail.followUp.doctorName && (
                          <Descriptions.Item label="随访医生">{detail.followUp.doctorName}</Descriptions.Item>
                        )}
                        {detail.followUp.dueDate && (
                          <Descriptions.Item label="截止日期">{detail.followUp.dueDate}</Descriptions.Item>
                        )}
                        <Descriptions.Item label="随访内容" span={2}>{detail.followUp.content}</Descriptions.Item>
                        {detail.followUp.result && (
                          <Descriptions.Item label="随访结果" span={2}>{detail.followUp.result}</Descriptions.Item>
                        )}
                        {detail.followUp.remark && (
                          <Descriptions.Item label="备注" span={2}>{detail.followUp.remark}</Descriptions.Item>
                        )}
                      </Descriptions>
                    </Card>
                  )}

                  <Card
                    type="inner"
                    size="small"
                    title={
                      <Space>
                        <FileTextOutlined style={{ color: '#722ed1' }} />
                        <span>主诉记录</span>
                      </Space>
                    }
                    style={{ marginBottom: 12 }}
                  >
                    {detail.chiefComplaint ? (
                      <Descriptions column={2} size="small" bordered>
                        <Descriptions.Item label="主诉" span={2}>{detail.chiefComplaint.description}</Descriptions.Item>
                        {detail.chiefComplaint.history && (
                          <Descriptions.Item label="病史" span={2}>{detail.chiefComplaint.history}</Descriptions.Item>
                        )}
                        {detail.chiefComplaint.examination && (
                          <Descriptions.Item label="检查" span={2}>{detail.chiefComplaint.examination}</Descriptions.Item>
                        )}
                        <Descriptions.Item label="诊断">
                          <Tag color="blue">{detail.chiefComplaint.diagnosis}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="就诊日期">{detail.chiefComplaint.visitDateText || detail.chiefComplaint.visitDate}</Descriptions.Item>
                        <Descriptions.Item label="治疗计划" span={2}>{detail.chiefComplaint.treatmentPlan}</Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: '#8c8c8c' }}>
                        暂无主诉记录
                      </div>
                    )}
                  </Card>

                  <Card
                    type="inner"
                    size="small"
                    title={
                      <Space>
                        <DollarOutlined style={{ color: '#52c41a' }} />
                        <span>收费项目</span>
                        {detail.feeItems && detail.feeItems.length > 0 && (
                          <Badge count={detail.feeItems.filter(f => f.status === 0).length} size="small" style={{ marginLeft: 4 }} />
                        )}
                      </Space>
                    }
                    style={{ marginBottom: 12 }}
                  >
                    {detail.feeItems && detail.feeItems.length > 0 ? (
                      <>
                        <Table
                          columns={feeColumns}
                          dataSource={detail.feeItems}
                          rowKey="id"
                          size="small"
                          pagination={false}
                        />
                        <Row justify="end" style={{ marginTop: 12, paddingRight: 16 }}>
                          <Col>
                            <Space direction="vertical" align="end" size={4}>
                              <div>
                                已缴：<span style={{ color: '#52c41a', fontWeight: 600 }}>
                                  ¥{detail.feeItems.filter(f => f.status === 1).reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
                                </span>
                              </div>
                              <div style={{ fontSize: 15, fontWeight: 600 }}>
                                待缴：<span style={{ color: '#f5222d' }}>
                                  ¥{detail.feeItems.filter(f => f.status === 0).reduce((sum, f) => sum + f.amount, 0).toFixed(2)}
                                </span>
                              </div>
                            </Space>
                          </Col>
                        </Row>
                        {detail.status !== 3 && (
                          <div style={{ textAlign: 'right', marginTop: 12 }}>
                            <Button type="primary" size="small">一键收费</Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: '#8c8c8c' }}>
                        暂无收费项目
                      </div>
                    )}
                  </Card>

                  <Card
                    type="inner"
                    size="small"
                    title={
                      <Space>
                        <MedicineBoxOutlined style={{ color: '#eb2f96' }} />
                        <span>处方费用</span>
                      </Space>
                    }
                  >
                    {detail.prescription ? (
                      <>
                        <Row gutter={16} style={{ marginBottom: 12 }}>
                          <Col span={8}>
                            <Statistic title="处方编号" value={detail.prescription.prescriptionNo} valueStyle={{ fontSize: 14 }} />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title="处方状态"
                              value={detail.prescription.statusText}
                              valueStyle={{ fontSize: 14, color: detail.prescription.status === 1 ? '#52c41a' : '#faad14' }}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title="处方总金额"
                              value={detail.prescription.totalAmount}
                              prefix="¥"
                              precision={2}
                              valueStyle={{ fontSize: 14, color: '#f5222d' }}
                            />
                          </Col>
                        </Row>
                        <Table
                          columns={prescriptionColumns}
                          dataSource={detail.prescription.items}
                          rowKey="id"
                          size="small"
                          pagination={false}
                        />
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: '#8c8c8c' }}>
                        暂无处方记录
                      </div>
                    )}
                  </Card>
                </Card>
              ) : (
                <Card style={{ height: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
                    <ToDoOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <p>加载中...</p>
                  </div>
                </Card>
              )}
            </Spin>
          ) : (
            <Card style={{ height: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
                <ToDoOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>请从左侧选择待办事项查看详情</p>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="办结待办"
        open={completeModalVisible}
        onOk={handleComplete}
        onCancel={() => setCompleteModalVisible(false)}
        width={520}
      >
        <Form form={completeForm} layout="vertical">
          <Form.Item
            name="result"
            label="处理结果"
            rules={[{ required: true, message: '请填写处理结果' }]}
          >
            <TextArea rows={4} placeholder="请填写处理结果和说明..." maxLength={500} showCount />
          </Form.Item>
          <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 16 }}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
            办结后将自动同步到排班负荷报表
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default TodoList
