
import React, { useState } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  DatePicker,
  Select,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Descriptions,
  Badge,
  Input,
  Alert,
  Tooltip,
  Collapse,
  Form,
  message
} from 'antd'
import {
  ApiOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ExportOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input
const { Panel } = Collapse

const ExternalApiLogs = () => {
  const [apiName, setApiName] = useState(null)
  const [status, setStatus] = useState(null)
  const [batchId, setBatchId] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [retryModalVisible, setRetryModalVisible] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [retryForm] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const apiNames = [
    { value: '短信发送接口', label: '短信发送接口' },
    { value: '微信通知接口', label: '微信通知接口' },
    { value: '医保结算接口', label: '医保结算接口' },
    { value: '患者信息同步接口', label: '患者信息同步接口' },
    { value: '电子病历上传接口', label: '电子病历上传接口' }
  ]

  const summaryStats = {
    totalCalls: 1286,
    successCount: 1210,
    failedCount: 76,
    successRate: 94.1,
    todayCalls: 86,
    todayFailed: 5
  }

  const byApiStats = [
    { apiName: '短信发送接口', total: 680, success: 652, failed: 28, rate: 95.9, color: '#1890ff' },
    { apiName: '微信通知接口', total: 380, success: 358, failed: 22, rate: 94.2, color: '#52c41a' },
    { apiName: '医保结算接口', total: 142, success: 128, failed: 14, rate: 90.1, color: '#fa8c16' },
    { apiName: '患者信息同步接口', total: 54, success: 50, failed: 4, rate: 92.6, color: '#722ed1' },
    { apiName: '电子病历上传接口', total: 30, success: 22, failed: 8, rate: 73.3, color: '#f5222d' }
  ]

  const logs = [
    {
      id: 1,
      apiName: '医保结算接口',
      batchId: 'BATCH20240116090001',
      requestUrl: 'https://api.medical.example.com/settle',
      requestBody: '{"patientId":1,"amount":1580.00}',
      responseBody: null,
      statusCode: null,
      isSuccess: false,
      errorMessage: 'Connection timed out after 30000ms',
      errorType: 'HttpRequestException',
      suggestion: '建议：1. 检查网络连接是否正常；2. 确认目标服务是否可达；3. 检查防火墙配置；4. 稍后重试',
      retryCount: 3,
      requestTime: '2024-01-16 09:15:23',
      responseTime: null,
      durationMs: null,
      canRetry: true,
      batchItems: [
        { id: 101, patientName: '张明', amount: 1580, status: 'Failed', error: '超时' },
        { id: 102, patientName: '李华', amount: 860, status: 'Failed', error: '超时' },
        { id: 103, patientName: '王芳', amount: 2200, status: 'Failed', error: '超时' }
      ]
    },
    {
      id: 2,
      apiName: '短信发送接口',
      batchId: 'BATCH20240116083002',
      requestUrl: 'https://api.sms.example.com/send',
      requestBody: '{"phone":"13900000001","content":"您的预约已确认..."}',
      responseBody: '{"code":401,"message":"Invalid API key"}',
      statusCode: 401,
      isSuccess: false,
      errorMessage: 'Invalid API key',
      errorType: 'HttpError',
      suggestion: '建议：1. 检查认证令牌是否有效；2. 确认权限是否足够；3. 重新获取认证令牌',
      retryCount: 3,
      requestTime: '2024-01-16 08:30:12',
      responseTime: '2024-01-16 08:30:12',
      durationMs: 156,
      canRetry: false,
      batchItems: [
        { id: 201, phone: '13900000001', content: '预约确认', status: 'Failed', error: '认证失败' }
      ]
    },
    {
      id: 3,
      apiName: '电子病历上传接口',
      batchId: 'BATCH20240115170003',
      requestUrl: 'https://api.emr.example.com/upload',
      requestBody: '{"emrId":12345,"data":...}',
      responseBody: '{"code":500,"message":"Internal server error"}',
      statusCode: 500,
      isSuccess: false,
      errorMessage: 'Internal server error',
      errorType: 'HttpError',
      suggestion: '建议：1. 服务端内部错误；2. 稍后重试；3. 联系接口服务方排查',
      retryCount: 2,
      requestTime: '2024-01-15 17:02:45',
      responseTime: '2024-01-15 17:02:48',
      durationMs: 3210,
      canRetry: true
    },
    {
      id: 4,
      apiName: '微信通知接口',
      batchId: 'BATCH20240116100004',
      requestUrl: 'https://api.wechat.example.com/notify',
      requestBody: '{"openid":"xxx","template_id":"yyy"}',
      responseBody: null,
      statusCode: null,
      isSuccess: false,
      errorMessage: 'A task was canceled.',
      errorType: 'TaskCanceledException',
      suggestion: '建议：1. 请求超时，检查目标服务响应速度；2. 考虑增加超时时间；3. 确认接口服务是否正常运行',
      retryCount: 3,
      requestTime: '2024-01-16 10:00:33',
      responseTime: null,
      durationMs: null,
      canRetry: true,
      batchItems: [
        { id: 401, patientName: '赵强', type: '复诊提醒', status: 'Failed', error: '超时' },
        { id: 402, patientName: '孙丽', type: '预约确认', status: 'Failed', error: '超时' }
      ]
    },
    {
      id: 5,
      apiName: '医保结算接口',
      batchId: 'BATCH20240116103005',
      requestUrl: 'https://api.medical.example.com/settle',
      requestBody: '{"patientId":5,"amount":680.00}',
      responseBody: '{"code":429,"message":"Too many requests"}',
      statusCode: 429,
      isSuccess: false,
      errorMessage: 'Too many requests',
      errorType: 'HttpError',
      suggestion: '建议：1. 请求过于频繁；2. 降低请求频率；3. 申请更高的调用配额',
      retryCount: 1,
      requestTime: '2024-01-16 10:30:08',
      responseTime: '2024-01-16 10:30:08',
      durationMs: 45,
      canRetry: true
    },
    {
      id: 6,
      apiName: '短信发送接口',
      batchId: 'BATCH20240116110006',
      requestUrl: 'https://api.sms.example.com/send',
      requestBody: '{"phone":"13900000010","content":"复诊提醒..."}',
      responseBody: '{"code":0,"message":"success"}',
      statusCode: 200,
      isSuccess: true,
      errorMessage: null,
      errorType: null,
      suggestion: null,
      retryCount: 0,
      requestTime: '2024-01-16 11:00:00',
      responseTime: '2024-01-16 11:00:00',
      durationMs: 128,
      canRetry: false
    }
  ]

  const filteredLogs = logs.filter(log => {
    if (apiName && log.apiName !== apiName) return false
    if (status !== null && status !== undefined) {
      if (status === 'success' && !log.isSuccess) return false
      if (status === 'failed' && log.isSuccess) return false
    }
    if (batchId && !log.batchId?.includes(batchId)) return false
    return true
  })

  const openDetail = (log) => {
    setSelectedLog(log)
    setDetailModalVisible(true)
  }

  const openRetry = (log) => {
    setSelectedLog(log)
    retryForm.setFieldsValue({ batchId: log.batchId, remark: '' })
    setRetryModalVisible(true)
  }

  const handleRetry = () => {
    retryForm.validateFields().then(() => {
      messageApi.success('已提交重试任务，请稍后查看结果')
      setRetryModalVisible(false)
      retryForm.resetFields()
    })
  }

  const columns = [
    {
      title: '接口名称',
      dataIndex: 'apiName',
      key: 'apiName',
      width: 140,
      fixed: 'left',
      render: (name) => (
        <Space>
          <ApiOutlined />
          <span>{name}</span>
        </Space>
      )
    },
    {
      title: '批次号',
      dataIndex: 'batchId',
      key: 'batchId',
      width: 170,
      render: (id) => (
        id ? (
          <Tooltip title={`批次号：${id}`}>
            <Tag color="blue" style={{ fontFamily: 'monospace' }}>{id}</Tag>
          </Tooltip>
        ) : '-'
      )
    },
    {
      title: '请求时间',
      dataIndex: 'requestTime',
      key: 'requestTime',
      width: 160
    },
    {
      title: '耗时',
      dataIndex: 'durationMs',
      key: 'durationMs',
      width: 90,
      align: 'right',
      render: (ms) => ms ? `${ms}ms` : <Tag color="orange">超时</Tag>
    },
    {
      title: '状态',
      dataIndex: 'isSuccess',
      key: 'isSuccess',
      width: 90,
      align: 'center',
      render: (success) => (
        success
          ? <Badge status="success" text={<Tag color="green">成功</Tag>} />
          : <Badge status="error" text={<Tag color="red">失败</Tag>} />
      )
    },
    {
      title: '重试次数',
      dataIndex: 'retryCount',
      key: 'retryCount',
      width: 90,
      align: 'center',
      render: (count, record) => (
        count > 0
          ? <Tag color={record.isSuccess ? 'green' : 'orange'}>{count} 次</Tag>
          : <span style={{ color: '#8c8c8c' }}>-</span>
      )
    },
    {
      title: '错误类型',
      dataIndex: 'errorType',
      key: 'errorType',
      width: 160,
      render: (type, record) => (
        record.isSuccess ? (
          <span style={{ color: '#52c41a' }}>无</span>
        ) : (
          <Tag color="volcano">{type}</Tag>
        )
      )
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      ellipsis: true,
      width: 200,
      render: (msg) => msg || <span style={{ color: '#52c41a' }}>-</span>
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<InfoCircleOutlined />} onClick={() => openDetail(record)}>
            详情
          </Button>
          {!record.isSuccess && record.canRetry && (
            <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => openRetry(record)}>
              重试
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      {contextHolder}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Card>
            <Statistic
              title="总调用次数"
              value={summaryStats.totalCalls}
              prefix={<ApiOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="成功次数"
              value={summaryStats.successCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="失败次数"
              value={summaryStats.failedCount}
              prefix={<CloseCircleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
              extra={
                <span style={{ fontSize: 12, color: '#fa8c16' }}>
                  今日失败 {summaryStats.todayFailed} 次
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="成功率"
              value={summaryStats.successRate}
              suffix="%"
              prefix={<ThunderboltOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card
            actions={[
              <Button type="primary" block icon={<ExportOutlined />} size="small">导出日志</Button>,
              <Button block icon={<ReloadOutlined />} size="small">刷新数据</Button>
            ]}
          >
            <Statistic title="今日调用" value={summaryStats.todayCalls} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Alert
          message={
            <Space>
              <WarningOutlined style={{ color: '#fa8c16' }} />
              <span>当前共有 <strong style={{ color: '#f5222d' }}>{summaryStats.failedCount}</strong> 条失败记录需要处理，其中 <strong>{logs.filter(l => !l.isSuccess && l.canRetry).length}</strong> 条可重试</span>
            </Space>
          }
          type="warning"
          showIcon={false}
          style={{ marginBottom: 16 }}
        />
        <Space wrap>
          <span style={{ fontWeight: 500 }}>接口：</span>
          <Select
            placeholder="全部接口"
            value={apiName}
            onChange={setApiName}
            style={{ width: 180 }}
            allowClear
          >
            {apiNames.map(a => <Option key={a.value} value={a.value}>{a.label}</Option>)}
          </Select>
          <span style={{ fontWeight: 500 }}>状态：</span>
          <Select
            placeholder="全部状态"
            value={status}
            onChange={setStatus}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="success">成功</Option>
            <Option value="failed">失败</Option>
          </Select>
          <span style={{ fontWeight: 500 }}>批次号：</span>
          <Input
            placeholder="搜索批次号"
            value={batchId}
            onChange={e => setBatchId(e.target.value)}
            style={{ width: 180 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <span style={{ fontWeight: 500 }}>时间：</span>
          <RangePicker value={dateRange} onChange={setDateRange} showTime />
          <Button type="primary" icon={<SearchOutlined />}>查询</Button>
          <Button onClick={() => { setApiName(null); setStatus(null); setBatchId(''); setDateRange(null) }}>重置</Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card title="各接口调用情况" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {byApiStats.map(item => (
                <div key={item.apiName}>
                  <Row justify="space-between" style={{ marginBottom: 2 }}>
                    <Col>
                      <Space size="small">
                        <Tag color={item.rate >= 95 ? 'green' : item.rate >= 90 ? 'blue' : item.rate >= 80 ? 'orange' : 'red'}>
                          {item.rate}%
                        </Tag>
                        <span style={{ fontSize: 13 }}>{item.apiName}</span>
                      </Space>
                    </Col>
                    <Col>
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                        失败 <span style={{ color: '#f5222d' }}>{item.failed}</span>/{item.total}
                      </span>
                    </Col>
                  </Row>
                  <div style={{
                    height: 4,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${item.rate}%`,
                      height: '100%',
                      backgroundColor: item.color,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="接口调用日志" size="small">
            <Table
              columns={columns}
              dataSource={filteredLogs}
              rowKey="id"
              size="small"
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#1890ff' }} />
            <span>接口调用详情</span>
            <Badge status={selectedLog?.isSuccess ? 'success' : 'error'} />
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={880}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          selectedLog && !selectedLog.isSuccess && selectedLog.canRetry && (
            <Button key="retry" type="primary" icon={<ReloadOutlined />} onClick={() => { setDetailModalVisible(false); openRetry(selectedLog) }}>
              发起重试
            </Button>
          )
        ]}
      >
        {selectedLog && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="接口名称">{selectedLog.apiName}</Descriptions.Item>
              <Descriptions.Item label="批次号">
                <Tag color="blue" style={{ fontFamily: 'monospace' }}>{selectedLog.batchId || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="请求时间">{selectedLog.requestTime}</Descriptions.Item>
              <Descriptions.Item label="响应时间">{selectedLog.responseTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="HTTP状态码">
                {selectedLog.statusCode
                  ? <Tag color={selectedLog.statusCode >= 400 ? 'red' : 'green'}>{selectedLog.statusCode}</Tag>
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="耗时">{selectedLog.durationMs ? `${selectedLog.durationMs}ms` : <Tag color="orange">请求超时</Tag>}</Descriptions.Item>
              <Descriptions.Item label="调用结果" span={2}>
                {selectedLog.isSuccess
                  ? <Tag color="green" icon={<CheckCircleOutlined />}>调用成功</Tag>
                  : <Tag color="red" icon={<CloseCircleOutlined />}>调用失败</Tag>}
                {selectedLog.retryCount > 0 && <Tag color="orange" style={{ marginLeft: 8 }}>已重试 {selectedLog.retryCount} 次</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="请求URL" span={2}>
                <code style={{ wordBreak: 'break-all', fontSize: 12 }}>{selectedLog.requestUrl}</code>
              </Descriptions.Item>
            </Descriptions>

            {!selectedLog.isSuccess && (
              <Alert
                message={
                  <Space>
                    <ThunderboltOutlined />
                    <span><strong>错误类型：</strong>{selectedLog.errorType}</span>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <div style={{ padding: '8px 12px', backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 4 }}>
                      <strong style={{ color: '#f5222d' }}>错误原因：</strong>
                      <div style={{ marginTop: 4, color: '#595959' }}>{selectedLog.errorMessage}</div>
                    </div>
                    <div style={{ padding: '8px 12px', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4 }}>
                      <strong style={{ color: '#1890ff' }}>💡 处理建议：</strong>
                      <div style={{ marginTop: 4, color: '#595959', whiteSpace: 'pre-wrap' }}>{selectedLog.suggestion}</div>
                    </div>
                  </Space>
                }
                type="error"
                showIcon={false}
              />
            )}

            <Collapse size="small" ghost>
              <Panel header="请求参数" key="request">
                <pre style={{
                  backgroundColor: '#fafafa',
                  padding: 12,
                  borderRadius: 4,
                  border: '1px solid #d9d9d9',
                  maxHeight: 150,
                  overflow: 'auto',
                  fontSize: 12,
                  margin: 0
                }}>
                  {selectedLog.requestBody || '（无）'}
                </pre>
              </Panel>
              <Panel header="响应内容" key="response">
                <pre style={{
                  backgroundColor: selectedLog.isSuccess ? '#f6ffed' : '#fff1f0',
                  padding: 12,
                  borderRadius: 4,
                  border: `1px solid ${selectedLog.isSuccess ? '#b7eb8f' : '#ffa39e'}`,
                  maxHeight: 150,
                  overflow: 'auto',
                  fontSize: 12,
                  margin: 0
                }}>
                  {selectedLog.responseBody || '（无响应内容，可能是请求超时或连接失败）'}
                </pre>
              </Panel>
              {selectedLog.batchItems && selectedLog.batchItems.length > 0 && (
                <Panel header={`批次明细（${selectedLog.batchItems.length}条）`} key="batch">
                  <Table
                    size="small"
                    dataSource={selectedLog.batchItems}
                    rowKey="id"
                    pagination={false}
                  >
                    <Table.Column
                      title="状态"
                      dataIndex="status"
                      key="status"
                      width={80}
                      render={(s) => <Tag color={s === 'Success' ? 'green' : 'red'}>{s === 'Success' ? '成功' : '失败'}</Tag>}
                    />
                    {selectedLog.batchItems[0]?.patientName && (
                      <Table.Column title="患者" dataIndex="patientName" key="patientName" width={100} />
                    )}
                    {selectedLog.batchItems[0]?.phone && (
                      <Table.Column title="手机号" dataIndex="phone" key="phone" width={130} />
                    )}
                    {selectedLog.batchItems[0]?.type && (
                      <Table.Column title="通知类型" dataIndex="type" key="type" width={100} />
                    )}
                    {selectedLog.batchItems[0]?.amount && (
                      <Table.Column
                        title="金额"
                        dataIndex="amount"
                        key="amount"
                        width={100}
                        align="right"
                        render={(v) => `¥${v.toFixed(2)}`}
                      />
                    )}
                    <Table.Column title="错误信息" dataIndex="error" key="error" ellipsis />
                  </Table>
                </Panel>
              )}
            </Collapse>
          </Space>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <ReloadOutlined style={{ color: '#1890ff' }} />
            <span>发起重试 - {selectedLog?.apiName}</span>
          </Space>
        }
        open={retryModalVisible}
        onOk={handleRetry}
        onCancel={() => setRetryModalVisible(false)}
        okText="确认重试"
        width={520}
      >
        <Form form={retryForm} layout="vertical">
          <Form.Item label="批次号" name="batchId">
            <Input disabled />
          </Form.Item>
          {selectedLog && (
            <>
              <Alert
                message="错误回顾"
                description={
                  <Space direction="vertical" size={4}>
                    <div><strong>错误原因：</strong>{selectedLog.errorMessage}</div>
                    <div style={{ color: '#1890ff' }}>💡 {selectedLog.suggestion}</div>
                  </Space>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="接口">{selectedLog.apiName}</Descriptions.Item>
                <Descriptions.Item label="已重试次数">
                  <Tag color="orange">{selectedLog.retryCount} 次</Tag>
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
          <Form.Item
            name="remark"
            label="备注说明"
          >
            <TextArea rows={3} placeholder="可选：填写本次重试的备注信息..." maxLength={200} showCount />
          </Form.Item>
          <div style={{
            padding: 12,
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 4,
            fontSize: 12,
            color: '#389e0d'
          }}>
            <Space>
              <ClockCircleOutlined />
              <span>重试将使用指数退避策略（2s → 4s → 8s），最多重试3次</span>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default ExternalApiLogs
