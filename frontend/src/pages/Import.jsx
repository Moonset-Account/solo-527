import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Select,
  Modal,
  Tag,
  App,
  Card,
  Upload,
  Tabs,
  Alert,
  Descriptions,
  Row,
  Col,
  Statistic,
  Divider,
} from 'antd'
import {
  ImportOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  HistoryOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { importApi } from '../services/api'

const { Option } = Select
const { Dragger } = Upload
const { TabPane } = Tabs

const ImportData = () => {
  const [activeTab, setActiveTab] = useState('equipment')
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [resultVisible, setResultVisible] = useState(false)
  const [errorDetail, setErrorDetail] = useState(null)
  const [errorVisible, setErrorVisible] = useState(false)
  const { message } = App.useApp()

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const res = await importApi.getBatches({ type: activeTab === 'equipment' ? 'EQUIPMENT' : 'WORK_ORDER' })
      if (res.code === 200) setBatches(res.data)
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const equipmentTemplate = [
    { name: '设备编号*', key: 'code' },
    { name: '设备名称*', key: 'name' },
    { name: '设备型号', key: 'model' },
    { name: '设备类型', key: 'type' },
    { name: '所属车间', key: 'workshop' },
    { name: '二维码', key: 'qrCode' },
    { name: '备注', key: 'remark' },
  ]

  const workOrderTemplate = [
    { name: '工单号*', key: 'orderNo' },
    { name: '产品名称*', key: 'productName' },
    { name: '计划数量*', key: 'plannedQuantity', type: 'number' },
    { name: '客户名称', key: 'customer' },
    { name: '交货日期 (YYYY-MM-DD)', key: 'deliveryDate' },
    { name: '备注', key: 'remark' },
  ]

  const downloadTemplate = () => {
    const template = activeTab === 'equipment' ? equipmentTemplate : workOrderTemplate
    const headers = template.map((t) => t.name)
    const ws = XLSX.utils.aoa_to_sheet([headers])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `${activeTab === 'equipment' ? '设备导入模板' : '工单导入模板'}.xlsx`)
  }

  const beforeUpload = (file) => {
    const isExcel =
      file.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    if (!isExcel) {
      message.error('只支持 Excel 文件格式！')
      return Upload.LIST_IGNORE
    }
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('文件不能超过 10MB！')
      return Upload.LIST_IGNORE
    }
    return false
  }

  const handleUpload = async (file) => {
    setImporting(true)
    try {
      const apiMethod = activeTab === 'equipment' ? importApi.importEquipment : importApi.importWorkOrder
      const res = await apiMethod(file)
      if (res.code === 200) {
        setImportResult(res.data)
        setResultVisible(true)
        if (res.data.successCount > 0) {
          message.success(`导入成功：${res.data.successCount} 条`)
        }
        if (res.data.failCount > 0) {
          message.warning(`导入失败：${res.data.failCount} 条，请查看详情`)
        }
        fetchBatches()
      } else {
        message.error(res.message || '导入失败')
      }
    } catch (e) {
      message.error('导入失败：' + (e.message || '未知错误'))
    } finally {
      setImporting(false)
    }
  }

  const viewErrors = (record) => {
    setErrorDetail(record)
    setErrorVisible(true)
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'default',
      PROCESSING: 'processing',
      COMPLETED: 'success',
      FAILED: 'error',
      PARTIAL: 'warning',
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = {
      PENDING: '待处理',
      PROCESSING: '处理中',
      COMPLETED: '全部成功',
      FAILED: '全部失败',
      PARTIAL: '部分成功',
    }
    return texts[status] || status
  }

  const getTypeText = (type) => {
    const texts = {
      EQUIPMENT: '设备',
      WORK_ORDER: '工单',
    }
    return texts[type] || type
  }

  const errorColumns = [
    {
      title: '行号',
      dataIndex: 'rowNumber',
      key: 'rowNumber',
      width: 80,
      render: (v) => `第 ${v} 行`,
    },
    {
      title: '字段',
      dataIndex: 'field',
      key: 'field',
      width: 120,
    },
    {
      title: '原始值',
      dataIndex: 'value',
      key: 'value',
      ellipsis: true,
    },
    {
      title: '错误原因',
      dataIndex: 'message',
      key: 'message',
      render: (text) => (
        <span style={{ color: '#ff4d4f' }}>{text}</span>
      ),
    },
  ]

  const batchColumns = [
    {
      title: '批次号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 180,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (t) => <Tag>{getTypeText(t)}</Tag>,
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
    },
    {
      title: '成功',
      dataIndex: 'successCount',
      key: 'successCount',
      width: 80,
      render: (v) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '失败',
      dataIndex: 'failCount',
      key: 'failCount',
      width: 80,
      render: (v) => (
        <span style={{ color: v > 0 ? '#ff4d4f' : '#999', fontWeight: 500 }}>
          {v}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => <Tag color={getStatusColor(s)}>{getStatusText(s)}</Tag>,
    },
    {
      title: '导入时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) =>
        record.failCount > 0 && record.errors && record.errors.length > 0 ? (
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewErrors(record)}>
            查看错误
          </Button>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Space>
            <ImportOutlined />
            批量导入
          </Space>
        </h1>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="数据导入" size="small">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key)
                setImportResult(null)
              }}
              size="small"
            >
              <TabPane tab="设备导入" key="equipment" />
              <TabPane tab="工单导入" key="workorder" />
            </Tabs>

            <Alert
              message="导入说明"
              description={
                <div>
                  <p style={{ margin: '4px 0' }}>
                  <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 4 }} />
                  请先下载导入模板，按照模板格式填写数据后上传。
                </p>
                  <p style={{ margin: '4px 0' }}>
                  <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 4 }} />
                  带 <span style={{ color: '#ff4d4f' }}>*</span> 的字段为必填项。
                </p>
                  <p style={{ margin: '4px 0' }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                  支持 .xlsx、.xls 格式，文件大小不超过 10MB。
                </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card size="small" title="模板字段说明" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                {(activeTab === 'equipment' ? equipmentTemplate : workOrderTemplate).map((t) => (
                  <Descriptions.Item key={t.key} label={t.name}>
                    {t.type === 'number' ? '数字类型' : '文本类型'}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="dashed"
                icon={<DownloadOutlined />}
                onClick={downloadTemplate}
                style={{ width: '100%' }}
              >
                下载导入模板
              </Button>

              <Dragger
                name="file"
                multiple={false}
                showUploadList={false}
                beforeUpload={beforeUpload}
                customRequest={({ file }) => handleUpload(file)}
                disabled={importing}
                accept=".xlsx,.xls"
              >
                <p className="ant-upload-drag-icon">
                  <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                </p>
                <p className="ant-upload-text">
                  {importing ? '正在导入...' : '点击或拖拽 Excel 文件到此处'}
                </p>
                <p className="ant-upload-hint">支持 .xlsx、.xls 格式</p>
              </Dragger>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <HistoryOutlined />
                导入历史记录
              </Space>
            }
            size="small"
            extra={
              <Button size="small" onClick={fetchBatches}>
                刷新
              </Button>
            }
          >
            <Table
              columns={batchColumns}
              dataSource={batches}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="导入结果"
        open={resultVisible}
        onCancel={() => setResultVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResultVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {importResult && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="总记录数"
                    value={importResult.totalCount}
                    prefix={<InfoCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="成功数量"
                    value={importResult.successCount}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="失败数量"
                    value={importResult.failCount}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {importResult.failCount > 0 && importResult.errors && importResult.errors.length > 0 && (
              <div>
                <Divider orientation="left">
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                    错误详情（请修正后重新上传）
                  </Space>
                </Divider>
                <Alert
                  message="温馨提示"
                  description="请根据以下错误信息修正 Excel 文件中的对应行，然后重新上传。"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  columns={errorColumns}
                  dataSource={importResult.errors}
                  rowKey={(r, i) => `${r.rowNumber}-${r.field}-${i}`}
                  pagination={false}
                  size="small"
                  scroll={{ y: 300 }}
                />
              </div>
            )}

            {importResult.failCount === 0 && (
              <Alert
                message="导入成功"
                description="所有数据都已成功导入！"
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="错误详情"
        open={errorVisible}
        onCancel={() => setErrorVisible(false)}
        footer={[
          <Button key="close" onClick={() => setErrorVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {errorDetail && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="批次号">{errorDetail.batchNo}</Descriptions.Item>
              <Descriptions.Item label="文件名">{errorDetail.fileName}</Descriptions.Item>
              <Descriptions.Item label="成功数量">
                <span style={{ color: '#52c41a' }}>{errorDetail.successCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="失败数量">
                <span style={{ color: '#ff4d4f' }}>{errorDetail.failCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="导入时间" span={2}>
                {dayjs(errorDetail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">错误列表</Divider>
            <Table
              columns={errorColumns}
              dataSource={errorDetail.errors}
              rowKey={(r, i) => `${r.rowNumber}-${r.field}-${i}`}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ImportData
