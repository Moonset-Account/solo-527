import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Form, Input, Select, Space, Modal, message, Spin, Drawer, Descriptions, DatePicker, InputNumber } from 'antd'
import { SearchOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { queryContractRisks, getContractRiskDetail, createContractRisk, updateRiskStatus } from '../api'
import dayjs from 'dayjs'

const levelMap = {
  LOW: { color: 'green', text: '低' },
  MEDIUM: { color: 'blue', text: '中' },
  HIGH: { color: 'orange', text: '高' },
  CRITICAL: { color: 'red', text: '严重' }
}

const statusMap = {
  OPEN: { color: 'red', text: '待处理' },
  PROCESSING: { color: 'processing', text: '处理中' },
  MITIGATED: { color: 'orange', text: '已缓解' },
  CLOSED: { color: 'green', text: '已关闭' }
}

export default function ContractRisk() {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({})
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [statusForm] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await queryContractRisks({
        ...filters,
        current: pagination.current,
        size: pagination.pageSize
      })
      setList(data.records || [])
      setPagination(p => ({ ...p, total: data.total || 0 }))
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const params = {}
    if (values.title) params.title = values.title
    if (values.riskType) params.riskType = values.riskType
    if (values.level) params.level = values.level
    if (values.status) params.status = values.status
    setFilters(params)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await createContractRisk({
        ...values,
        expectedCloseDate: values.expectedCloseDate?.format('YYYY-MM-DD')
      })
      message.success('创建成功')
      setCreateModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      message.error(e.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewDetail = async (item) => {
    try {
      const detail = await getContractRiskDetail(item.id)
      setCurrentItem(detail)
      setDetailVisible(true)
    } catch (e) {
      message.error('加载详情失败')
    }
  }

  const handleOpenStatus = (item) => {
    setCurrentItem(item)
    statusForm.resetFields()
    statusForm.setFieldsValue({ status: item.status })
    setStatusModalVisible(true)
  }

  const handleUpdateStatus = async () => {
    try {
      const values = await statusForm.validateFields()
      setSubmitting(true)
      await updateRiskStatus(currentItem.id, values.status, values.mitigationMeasures)
      message.success('更新成功')
      setStatusModalVisible(false)
      loadData()
    } catch (e) {
      message.error(e.message || '更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { title: '风险编号', dataIndex: 'riskNo', width: 140 },
    { title: '标题', dataIndex: 'title', width: 200, ellipsis: true },
    { title: '类型', dataIndex: 'riskType', width: 120 },
    {
      title: '风险等级', dataIndex: 'level', width: 90,
      render: v => levelMap[v] ? <Tag color={levelMap[v].color}>{levelMap[v].text}</Tag> : v
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => statusMap[v] ? <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag> : v
    },
    { title: '影响对象', dataIndex: 'affectedObjects', width: 180, ellipsis: true },
    {
      title: '负责人', dataIndex: 'personInCharge', width: 100,
      render: v => v ? `员工#${v}` : '-'
    },
    { title: '预计关闭', dataIndex: 'expectedCloseDate', width: 110, render: v => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          <Button size="small" type="primary" onClick={() => handleOpenStatus(r)}>更新状态</Button>
        </Space>
      )
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2 className="page-title">合同风险管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新增风险记录
          </Button>
        </div>

        <Form form={searchForm} layout="inline" className="filter-bar" onFinish={handleSearch}>
          <Form.Item name="title" label="标题">
            <Input placeholder="关键词" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="riskType" label="类型">
            <Select placeholder="全部" allowClear style={{ width: 130 }} options={[
              { value: '合同到期', label: '合同到期' },
              { value: '供应商合同', label: '供应商合同' },
              { value: '租户合同', label: '租户合同' },
              { value: '服务合同', label: '服务合同' },
              { value: '其他', label: '其他' }
            ]} />
          </Form.Item>
          <Form.Item name="level" label="风险等级">
            <Select placeholder="全部" allowClear style={{ width: 100 }} options={[
              { value: 'LOW', label: '低' },
              { value: 'MEDIUM', label: '中' },
              { value: 'HIGH', label: '高' },
              { value: 'CRITICAL', label: '严重' }
            ]} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 110 }} options={[
              { value: 'OPEN', label: '待处理' },
              { value: 'PROCESSING', label: '处理中' },
              { value: 'MITIGATED', label: '已缓解' },
              { value: 'CLOSED', label: '已关闭' }
            ]} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total })
          }}
        />

        <Modal
          title="新增合同风险记录"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
          destroyOnClose
          width={700}
        >
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Space size={16} style={{ display: 'flex' }}>
              <Form.Item label="风险标题" name="title" rules={[{ required: true }]} style={{ flex: 1 }}>
                <Input />
              </Form.Item>
              <Form.Item label="风险类型" name="riskType" rules={[{ required: true }]} style={{ flex: 1 }}>
                <Select options={[
                  { value: '合同到期', label: '合同到期' },
                  { value: '供应商合同', label: '供应商合同' },
                  { value: '租户合同', label: '租户合同' },
                  { value: '服务合同', label: '服务合同' },
                  { value: '其他', label: '其他' }
                ]} />
              </Form.Item>
            </Space>
            <Space size={16} style={{ display: 'flex' }}>
              <Form.Item label="风险等级" name="level" rules={[{ required: true }]} initialValue="MEDIUM" style={{ flex: 1 }}>
                <Select options={[
                  { value: 'LOW', label: '低' },
                  { value: 'MEDIUM', label: '中' },
                  { value: 'HIGH', label: '高' },
                  { value: 'CRITICAL', label: '严重' }
                ]} />
              </Form.Item>
              <Form.Item label="负责人" name="personInCharge" rules={[{ required: true }]} style={{ flex: 1 }}>
                <Select options={[
                  { value: 1, label: '管理员 (S001)' },
                  { value: 4, label: '王客服 (S004)' },
                  { value: 5, label: '赵财务 (S005)' }
                ]} />
              </Form.Item>
            </Space>
            <Form.Item label="影响对象（受影响的住户/供应商/合同等）" name="affectedObjects" rules={[{ required: true }]}>
              <Input.TextArea rows={2} placeholder="请详细描述影响对象" />
            </Form.Item>
            <Form.Item label="关闭条件（风险解除需满足的条件）" name="closingCondition" rules={[{ required: true }]}>
              <Input.TextArea rows={2} placeholder="请描述关闭该风险需满足的条件" />
            </Form.Item>
            <Space size={16} style={{ display: 'flex' }}>
              <Form.Item label="预计关闭日期" name="expectedCloseDate" style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="初始状态" name="status" initialValue="OPEN" style={{ flex: 1 }}>
                <Select options={[
                  { value: 'OPEN', label: '待处理' },
                  { value: 'PROCESSING', label: '处理中' }
                ]} />
              </Form.Item>
            </Space>
            <Form.Item label="详细描述" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="缓解措施" name="mitigationMeasures">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>提交</Button>
            </Form.Item>
          </Form>
        </Modal>

        <Drawer
          title="风险详情"
          open={detailVisible}
          onClose={() => setDetailVisible(false)}
          width={600}
        >
          {currentItem && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="风险编号">{currentItem.riskNo}</Descriptions.Item>
              <Descriptions.Item label="标题">{currentItem.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{currentItem.riskType}</Descriptions.Item>
              <Descriptions.Item label="风险等级">{levelMap[currentItem.level]?.text}</Descriptions.Item>
              <Descriptions.Item label="状态">{statusMap[currentItem.status]?.text}</Descriptions.Item>
              <Descriptions.Item label="负责人">{currentItem.personInCharge ? `员工#${currentItem.personInCharge}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="发现时间">{dayjs(currentItem.discoveredAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="预计关闭日期">{currentItem.expectedCloseDate ? dayjs(currentItem.expectedCloseDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
              {currentItem.actualCloseDate && <Descriptions.Item label="实际关闭日期">{dayjs(currentItem.actualCloseDate).format('YYYY-MM-DD')}</Descriptions.Item>}
              <Descriptions.Item label="影响对象">{currentItem.affectedObjects}</Descriptions.Item>
              <Descriptions.Item label="关闭条件">{currentItem.closingCondition}</Descriptions.Item>
              {currentItem.description && <Descriptions.Item label="详细描述">{currentItem.description}</Descriptions.Item>}
              {currentItem.mitigationMeasures && <Descriptions.Item label="缓解措施">{currentItem.mitigationMeasures}</Descriptions.Item>}
              {currentItem.remark && <Descriptions.Item label="备注">{currentItem.remark}</Descriptions.Item>}
            </Descriptions>
          )}
        </Drawer>

        <Modal
          title="更新风险状态"
          open={statusModalVisible}
          onCancel={() => setStatusModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          <Form form={statusForm} layout="vertical" onFinish={handleUpdateStatus}>
            <Form.Item label="状态" name="status" rules={[{ required: true }]}>
              <Select options={[
                { value: 'OPEN', label: '待处理' },
                { value: 'PROCESSING', label: '处理中' },
                { value: 'MITIGATED', label: '已缓解' },
                { value: 'CLOSED', label: '已关闭' }
              ]} />
            </Form.Item>
            <Form.Item label="缓解措施/备注" name="mitigationMeasures">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>确认更新</Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Spin>
  )
}
