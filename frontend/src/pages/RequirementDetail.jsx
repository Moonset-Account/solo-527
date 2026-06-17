import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Table,
  Popconfirm,
  DatePicker,
  InputNumber,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  MergeCellsOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  requirementApi,
  operationLogApi,
  delayApi,
  departmentApi,
  authApi,
} from '../api'
import { useUserStore } from '../store/userStore'

const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

const statusMap = {
  DRAFT: { text: '草稿', color: 'default' },
  SUBMITTED: { text: '已提交', color: 'blue' },
  IN_PROGRESS: { text: '进行中', color: 'processing' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已驳回', color: 'error' },
  MERGED: { text: '已合并', color: 'purple' },
  CLOSED: { text: '已关闭', color: 'default' },
}

const nodeStatusMap = {
  PENDING: { text: '待处理', color: 'default' },
  IN_PROGRESS: { text: '进行中', color: 'processing' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已驳回', color: 'error' },
  DELAYED: { text: '已延期', color: 'warning' },
  SKIPPED: { text: '已跳过', color: 'default' },
}

const priorityMap = {
  1: { text: '最高', color: 'red' },
  2: { text: '高', color: 'orange' },
  3: { text: '中', color: 'blue' },
  4: { text: '低', color: 'green' },
  5: { text: '最低', color: 'default' },
}

const RequirementDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [requirement, setRequirement] = useState(null)
  const [nodes, setNodes] = useState([])
  const [logs, setLogs] = useState([])
  const [delayRecords, setDelayRecords] = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const [submitModalVisible, setSubmitModalVisible] = useState(false)
  const [approveModalVisible, setApproveModalVisible] = useState(false)
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [stuckModalVisible, setStuckModalVisible] = useState(false)
  const [delayModalVisible, setDelayModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [currentNode, setCurrentNode] = useState(null)

  const [approveForm] = Form.useForm()
  const [rejectForm] = Form.useForm()
  const [stuckForm] = Form.useForm()
  const [delayForm] = Form.useForm()
  const [assignForm] = Form.useForm()

  useEffect(() => {
    fetchDetail()
    fetchDepartments()
    fetchUsers()
  }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const req = await requirementApi.getById(id)
      setRequirement(req)

      const nodeList = await requirementApi.getNodes(id)
      setNodes(nodeList)

      const delayList = await delayApi.getByRequirement(id)
      setDelayRecords(delayList)

      const logResult = await operationLogApi.getByRequirement(id, 0, 50)
      setLogs(logResult.content || [])
    } catch (error) {
      console.error('获取详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const result = await departmentApi.getAll()
      setDepartments(result)
    } catch (error) {
      console.error('获取部门列表失败:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const result = await authApi.getUsers()
      setUsers(result)
    } catch (error) {
      console.error('获取用户列表失败:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      await requirementApi.submit(id, 1)
      message.success('提交成功')
      setSubmitModalVisible(false)
      fetchDetail()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const handleApprove = async () => {
    try {
      const values = await approveForm.validateFields()
      await requirementApi.approveNode(currentNode.id, values.comment)
      message.success('审批通过')
      setApproveModalVisible(false)
      approveForm.resetFields()
      fetchDetail()
    } catch (error) {
      console.error('审批失败:', error)
    }
  }

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields()
      await requirementApi.rejectNode(currentNode.id, values.comment)
      message.success('已驳回')
      setRejectModalVisible(false)
      rejectForm.resetFields()
      fetchDetail()
    } catch (error) {
      console.error('驳回失败:', error)
    }
  }

  const handleMarkStuck = async () => {
    try {
      const values = await stuckForm.validateFields()
      await requirementApi.markNodeStuck(currentNode.id, values.reason)
      message.success('已标记卡住')
      setStuckModalVisible(false)
      stuckForm.resetFields()
      fetchDetail()
    } catch (error) {
      console.error('标记卡住失败:', error)
    }
  }

  const handleDelay = async () => {
    try {
      const values = await delayForm.validateFields()
      await delayApi.create({
        requirementId: id,
        delayDays: values.delayDays,
        reason: values.reason,
        responsibleDeptId: values.responsibleDeptId,
        nodeId: currentNode?.id,
      })
      message.success('延期记录已创建')
      setDelayModalVisible(false)
      delayForm.resetFields()
      fetchDetail()
    } catch (error) {
      console.error('创建延期记录失败:', error)
    }
  }

  const handleAssign = async () => {
    try {
      const values = await assignForm.validateFields()
      await requirementApi.assign(id, values.assigneeId)
      message.success('分配成功')
      setAssignModalVisible(false)
      assignForm.resetFields()
      fetchDetail()
    } catch (error) {
      console.error('分配失败:', error)
    }
  }

  const handleClose = async () => {
    try {
      await requirementApi.close(id)
      message.success('已关闭')
      fetchDetail()
    } catch (error) {
      console.error('关闭失败:', error)
    }
  }

  const openApproveModal = (node) => {
    setCurrentNode(node)
    setApproveModalVisible(true)
  }

  const openRejectModal = (node) => {
    setCurrentNode(node)
    setRejectModalVisible(true)
  }

  const openStuckModal = (node) => {
    setCurrentNode(node)
    setStuckModalVisible(true)
  }

  const getDeptName = (deptId) => {
    const dept = departments.find((d) => d.id === deptId)
    return dept?.deptName || '-'
  }

  const getUserName = (userId) => {
    const u = users.find((u) => u.id === userId)
    return u?.realName || u?.username || '-'
  }

  const canApproveNode = (node) => {
    if (node.status !== 'IN_PROGRESS') return false
    if (user?.role === 'ADMIN') return true
    if (node.assigneeId && node.assigneeId === user?.userId) return true
    if (user?.role === 'DEPT_MANAGER' && node.assigneeDeptId === user?.deptId) return true
    return false
  }

  const logColumns = [
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 100,
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
    },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
    },
    {
      title: '状态变更',
      key: 'status',
      width: 150,
      render: (_, record) => (
        <span>
          {record.beforeStatus && (
            <>
              <Tag color="default">{record.beforeStatus}</Tag>
              <span>→</span>
            </>
          )}
          {record.afterStatus && <Tag color="blue">{record.afterStatus}</Tag>}
        </span>
      ),
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  const delayColumns = [
    {
      title: '延期天数',
      dataIndex: 'delayDays',
      key: 'delayDays',
      width: 100,
      render: (days) => <Tag color="orange">{days} 天</Tag>,
    },
    {
      title: '责任部门',
      dataIndex: 'responsibleDeptId',
      key: 'responsibleDeptId',
      width: 120,
      render: (deptId) => getDeptName(deptId),
    },
    {
      title: '延期原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '原日期',
      dataIndex: 'originalDate',
      key: 'originalDate',
      width: 120,
    },
    {
      title: '新日期',
      dataIndex: 'newDate',
      key: 'newDate',
      width: 120,
    },
    {
      title: '操作人',
      dataIndex: 'operatorId',
      key: 'operatorId',
      width: 100,
      render: (userId) => getUserName(userId),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ]

  if (!requirement) {
    return <div>加载中...</div>
  }

  const statusInfo = statusMap[requirement.status] || statusMap.DRAFT
  const priorityInfo = priorityMap[requirement.priority] || priorityMap[3]

  return (
    <div className="page-container">
      <div className="table-toolbar">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h2 className="page-title" style={{ margin: 0 }}>
            需求详情
          </h2>
        </Space>
        <Space>
          {requirement.status === 'DRAFT' && (
            <>
              <Button type="primary" onClick={() => setSubmitModalVisible(true)}>
                提交审批
              </Button>
              <Button onClick={() => setAssignModalVisible(true)}>
                <UserOutlined /> 分配负责人
              </Button>
            </>
          )}
          {requirement.status !== 'CLOSED' && requirement.status !== 'MERGED' && (
            <Popconfirm title="确定要关闭该需求吗？" onConfirm={handleClose}>
              <Button danger>关闭需求</Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <Card className="detail-card">
        <Descriptions title="基本信息" bordered column={2}>
          <Descriptions.Item label="ID">{requirement.id}</Descriptions.Item>
          <Descriptions.Item label="标题" span={2}>
            {requirement.title}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={priorityInfo.color}>{priorityInfo.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="分类">
            {requirement.category || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="所属部门">
            {getDeptName(requirement.deptId)}
          </Descriptions.Item>
          <Descriptions.Item label="创建人">
            {getUserName(requirement.creatorId)}
          </Descriptions.Item>
          <Descriptions.Item label="负责人">
            {requirement.assigneeId ? getUserName(requirement.assigneeId) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(requirement.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="预期完成">
            {requirement.expectedDate || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="实际完成">
            {requirement.actualDate || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="标签">
            {requirement.tags || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {requirement.description || '-'}
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="detail-card" title="审批流程">
        <div className="workflow-timeline">
          <Timeline
            items={nodes.map((node) => {
              const ns = nodeStatusMap[node.status] || nodeStatusMap.PENDING
              let color = 'gray'
              if (node.status === 'APPROVED') color = 'green'
              if (node.status === 'IN_PROGRESS') color = 'blue'
              if (node.status === 'REJECTED') color = 'red'
              if (node.stuck) color = 'orange'

              return {
                color,
                children: (
                  <div style={{ paddingBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{node.nodeName}</strong>
                        <Tag color={ns.color} style={{ marginLeft: 8 }}>
                          {ns.text}
                        </Tag>
                        {node.stuck && (
                          <Tag color="orange" style={{ marginLeft: 4 }}>
                            已卡住
                          </Tag>
                        )}
                      </div>
                      {canApproveNode(node) && (
                        <Space>
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={() => openApproveModal(node)}
                          >
                            通过
                          </Button>
                          <Button
                            size="small"
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => openRejectModal(node)}
                          >
                            驳回
                          </Button>
                          <Button
                            size="small"
                            icon={<StopOutlined />}
                            onClick={() => openStuckModal(node)}
                          >
                            标记卡住
                          </Button>
                        </Space>
                      )}
                    </div>
                    <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                      处理人：{node.assigneeId ? getUserName(node.assigneeId) : '-'} |
                      负责部门：{getDeptName(node.assigneeDeptId)}
                    </div>
                    {node.startTime && (
                      <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                        开始时间：{dayjs(node.startTime).format('YYYY-MM-DD HH:mm')}
                        {node.endTime && (
                          <> | 结束时间：{dayjs(node.endTime).format('YYYY-MM-DD HH:mm')}</>
                        )}
                        {node.dueTime && (
                          <> | 截止时间：{dayjs(node.dueTime).format('YYYY-MM-DD HH:mm')}</>
                        )}
                      </div>
                    )}
                    {node.comment && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '8px 12px',
                          background: '#f5f5f5',
                          borderRadius: 4,
                          fontSize: 13,
                        }}
                      >
                        审批意见：{node.comment}
                      </div>
                    )}
                  </div>
                ),
              }
            })}
          />
        </div>

        <Divider />

        <Button icon={<ClockCircleOutlined />} onClick={() => setDelayModalVisible(true)}>
          申请延期
        </Button>
      </Card>

      <Card className="detail-card">
        <Tabs defaultActiveKey="logs">
          <TabPane tab="操作日志" key="logs">
            <Table
              columns={logColumns}
              dataSource={logs}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </TabPane>
          <TabPane tab="延期记录" key="delays">
            <Table
              columns={delayColumns}
              dataSource={delayRecords}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 提交审批弹窗 */}
      <Modal
        title="提交审批"
        open={submitModalVisible}
        onOk={handleSubmit}
        onCancel={() => setSubmitModalVisible(false)}
        okText="提交"
      >
        <p>确定要提交该需求进入审批流程吗？</p>
      </Modal>

      {/* 通过弹窗 */}
      <Modal
        title="审批通过"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        okText="确认通过"
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item name="comment" label="审批意见">
            <TextArea rows={4} placeholder="请输入审批意见（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 驳回弹窗 */}
      <Modal
        title="审批驳回"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="comment"
            label="驳回原因"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <TextArea rows={4} placeholder="请输入驳回原因" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 标记卡住弹窗 */}
      <Modal
        title="标记节点卡住"
        open={stuckModalVisible}
        onOk={handleMarkStuck}
        onCancel={() => setStuckModalVisible(false)}
        okText="确认标记"
      >
        <Form form={stuckForm} layout="vertical">
          <Form.Item
            name="reason"
            label="卡住原因"
            rules={[{ required: true, message: '请输入卡住原因' }]}
          >
            <TextArea rows={4} placeholder="请详细描述卡住的原因" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 延期申请弹窗 */}
      <Modal
        title="申请延期"
        open={delayModalVisible}
        onOk={handleDelay}
        onCancel={() => setDelayModalVisible(false)}
        okText="提交申请"
        width={500}
      >
        <Form form={delayForm} layout="vertical">
          <Form.Item
            name="delayDays"
            label="延期天数"
            rules={[{ required: true, message: '请输入延期天数' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入延期天数" />
          </Form.Item>
          <Form.Item
            name="responsibleDeptId"
            label="责任部门"
            rules={[{ required: true, message: '请选择责任部门' }]}
          >
            <Select placeholder="请选择责任部门">
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.deptName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="延期原因"
            rules={[{ required: true, message: '请输入延期原因' }]}
          >
            <TextArea rows={4} placeholder="请详细描述延期原因" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分配负责人弹窗 */}
      <Modal
        title="分配负责人"
        open={assignModalVisible}
        onOk={handleAssign}
        onCancel={() => setAssignModalVisible(false)}
        okText="确认分配"
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="assigneeId"
            label="负责人"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select placeholder="请选择负责人" showSearch optionFilterProp="children">
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.realName} ({u.username})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RequirementDetail
