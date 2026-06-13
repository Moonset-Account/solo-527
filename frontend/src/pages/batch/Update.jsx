import React, { useState, useEffect } from 'react'
import {
  Table, Button, Select, Input, Space, Modal, Form, InputNumber,
  message, Card, Tag, Descriptions, Alert, Tabs,
} from 'antd'
import {
  DatabaseOutlined, SearchOutlined, CheckOutlined,
  ExclamationCircleOutlined, FileTextOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  previewBatchUpdate,
  batchUpdate,
  getBatchLogs,
  getBatchDetail,
  getPurchaseRequests,
} from '../../services/api'

const entityOptions = [
  { value: 'purchaseRequest', label: '采购需求' },
  { value: 'supplier', label: '供应商' },
]

const fieldOptions = {
  purchaseRequest: [
    { value: 'status', label: '状态', type: 'select' },
    { value: 'department', label: '部门', type: 'text' },
    { value: 'remark', label: '备注', type: 'textarea' },
  ],
  supplier: [
    { value: 'riskLevel', label: '风险等级', type: 'number' },
    { value: 'riskNote', label: '风险说明', type: 'textarea' },
    { value: 'contact', label: '联系人', type: 'text' },
  ],
}

const BatchUpdate = () => {
  const [entityType, setEntityType] = useState('purchaseRequest')
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [field, setField] = useState('')
  const [fieldValue, setFieldValue] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [resultVisible, setResultVisible] = useState(false)
  const [resultData, setResultData] = useState(null)
  const navigate = useNavigate()

  const fetchData = async () => {
    setLoading(true)
    try {
      if (entityType === 'purchaseRequest') {
        const res = await getPurchaseRequests({ pageSize: 50 })
        setData(res.list || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [entityType])

  const handlePreview = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要更新的记录')
      return
    }
    if (!field) {
      message.warning('请选择要更新的字段')
      return
    }

    try {
      const data = {
        ids: selectedRowKeys,
        data: { [field]: fieldValue },
        entityType,
      }
      const res = await previewBatchUpdate(data)
      setPreviewData(res)
      setPreviewVisible(true)
    } catch (e) {}
  }

  const handleConfirmUpdate = async () => {
    try {
      const fields = fieldOptions[entityType]
        .filter(f => f.value === field)
        .map(f => ({
          name: f.value,
          label: f.label,
          type: f.type,
          required: true,
        }))

      const data = {
        ids: selectedRowKeys,
        data: { [field]: fieldValue },
        entityType,
        fields,
        scopeNote: `批量更新 ${selectedRowKeys.length} 条${entityOptions.find(o => o.value === entityType)?.label}的${fieldOptions[entityType].find(f => f.value === field)?.label}`,
      }
      const res = await batchUpdate(data)
      setResultData(res)
      setPreviewVisible(false)
      setResultVisible(true)
      message.success('批量更新完成')
      fetchData()
    } catch (e) {}
  }

  const columns = entityType === 'purchaseRequest' ? [
    { title: '需求编号', dataIndex: 'requestNo', width: 150 },
    { title: '标题', dataIndex: 'title' },
    { title: '项目名称', dataIndex: 'projectName', width: 150 },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (v) => {
        const map = { draft: '草稿', pending: '审批中', approved: '已通过', rejected: '已驳回' }
        return <Tag>{map[v] || v}</Tag>
      }
    },
    { title: '总金额', dataIndex: 'totalAmount', width: 120, render: (v) => `¥${Number(v).toLocaleString()}` },
  ] : [
    { title: '供应商编码', dataIndex: 'code', width: 120 },
    { title: '名称', dataIndex: 'name' },
    { title: '联系人', dataIndex: 'contact', width: 100 },
    { title: '风险等级', dataIndex: 'riskLevel', width: 100 },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys)
      setSelectedRows(rows)
    },
  }

  return (
    <div className="page-container">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>批量更新</span>
        <Button onClick={() => navigate('/batch/logs')}>操作日志</Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <div>
            <label style={{ marginRight: 8 }}>数据类型：</label>
            <Select
              value={entityType}
              onChange={(v) => {
                setEntityType(v)
                setSelectedRowKeys([])
                setField('')
                setFieldValue('')
              }}
              style={{ width: 180 }}
            >
              {entityOptions.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <label style={{ marginRight: 8 }}>更新字段：</label>
            <Select
              value={field || undefined}
              onChange={(v) => {
                setField(v)
                setFieldValue('')
              }}
              style={{ width: 180 }}
              placeholder="选择字段"
            >
              {fieldOptions[entityType]?.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <label style={{ marginRight: 8 }}>字段值：</label>
            {field && fieldOptions[entityType].find(f => f.value === field)?.type === 'select' ? (
              <Select
                value={fieldValue || undefined}
                onChange={setFieldValue}
                style={{ width: 180 }}
                placeholder="选择值"
              >
                {field === 'status' && (
                  <>
                    <Select.Option value="draft">草稿</Select.Option>
                    <Select.Option value="pending">审批中</Select.Option>
                    <Select.Option value="approved">已通过</Select.Option>
                    <Select.Option value="rejected">已驳回</Select.Option>
                  </>
                )}
              </Select>
            ) : field && fieldOptions[entityType].find(f => f.value === field)?.type === 'number' ? (
              <InputNumber
                value={fieldValue}
                onChange={setFieldValue}
                style={{ width: 180 }}
                placeholder="输入值"
              />
            ) : field && fieldOptions[entityType].find(f => f.value === field)?.type === 'textarea' ? (
              <Input.TextArea
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                style={{ width: 250 }}
                rows={1}
                placeholder="输入值"
              />
            ) : (
              <Input
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                style={{ width: 180 }}
                placeholder="输入值"
              />
            )}
          </div>
          <Button
            type="primary"
            icon={<DatabaseOutlined />}
            onClick={handlePreview}
            disabled={selectedRowKeys.length === 0 || !field}
          >
            预览并更新
          </Button>
        </Space>
        <div style={{ marginTop: 12, color: '#666' }}>
          已选择 <strong style={{ color: '#1890ff' }}>{selectedRowKeys.length}</strong> 条记录
        </div>
      </Card>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="批量更新确认"
        open={previewVisible}
        onOk={handleConfirmUpdate}
        onCancel={() => setPreviewVisible(false)}
        okText="确认更新"
        cancelText="取消"
        width={600}
        okButtonProps={{ danger: true }}
      >
        {previewData && (
          <div>
            <Alert
              message={<span>将更新 <strong>{previewData.count}</strong> 条记录的 <strong>{previewData.fieldInfo?.length || 0}</strong> 个字段</span>}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="操作范围">{previewData.scopeNote}</Descriptions.Item>
              {previewData.fieldInfo?.map((f, idx) => (
                <Descriptions.Item key={idx} label={f.field}>
                  {String(f.newValue)}
                </Descriptions.Item>
              ))}
            </Descriptions>
            <div className="detail-section-title">涉及记录（前10条）</div>
            <Table
              size="small"
              dataSource={previewData.records?.slice(0, 10) || []}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '编号/名称', dataIndex: entityType === 'purchaseRequest' ? 'requestNo' : 'name' },
                { title: entityType === 'purchaseRequest' ? '标题' : '编码', dataIndex: entityType === 'purchaseRequest' ? 'title' : 'code' },
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="批量更新结果"
        open={resultVisible}
        onCancel={() => setResultVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResultVisible(false)}>关闭</Button>,
        ]}
        width={700}
      >
        {resultData && (
          <div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{resultData.totalCount}</div>
                <div style={{ color: '#666' }}>总计</div>
              </Card>
              <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{resultData.successCount}</div>
                <div style={{ color: '#666' }}>成功</div>
              </Card>
              <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{resultData.failCount}</div>
                <div style={{ color: '#666' }}>失败</div>
              </Card>
            </div>
            {resultData.failRecords?.length > 0 && (
              <div>
                <div className="detail-section-title">失败记录（字段级错误）</div>
                <Table
                  size="small"
                  dataSource={resultData.failRecords}
                  rowKey="recordId"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    { title: '记录ID', dataIndex: 'recordId', width: 100 },
                    {
                      title: '错误字段',
                      dataIndex: 'errorFields',
                      render: (v) => v ? (
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          {Object.entries(v).map(([k, val]) => (
                            <li key={k} style={{ color: '#f5222d' }}>
                              <strong>{k}:</strong> {val}
                            </li>
                          ))}
                        </ul>
                      ) : '-',
                    },
                    { title: '错误信息', dataIndex: 'errorMessage' },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default BatchUpdate
