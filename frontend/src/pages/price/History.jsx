import React, { useState, useEffect } from 'react'
import { Table, Input, Button, Space, Modal, Form, InputNumber, DatePicker, Select, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPriceHistory, addPriceHistory, getSuppliers } from '../../services/api'

const PriceHistory = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [keyword, setKeyword] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [suppliers, setSuppliers] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res = await getPriceHistory({
        page, pageSize,
        materialName: keyword,
        supplierId: supplierId || undefined,
      })
      setData(res.list)
      setPagination({ current: page, pageSize, total: res.total })
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliers({ pageSize: 100 })
      setSuppliers(res.list || [])
    } catch (e) {}
  }

  useEffect(() => {
    fetchData()
    fetchSuppliers()
  }, [])

  const handleSearch = () => {
    fetchData(1, pagination.pageSize)
  }

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await addPriceHistory({
        ...values,
        effectiveDate: values.effectiveDate.format('YYYY-MM-DD'),
      })
      message.success('添加成功')
      setModalVisible(false)
      fetchData(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const columns = [
    { title: '物料名称', dataIndex: 'materialName', width: 150 },
    { title: '规格型号', dataIndex: 'specification' },
    { title: '单位', dataIndex: 'unit', width: 80 },
    {
      title: '价格',
      dataIndex: 'price',
      width: 120,
      render: (v) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{Number(v).toLocaleString()}</span>,
    },
    { title: '供应商', dataIndex: ['supplier', 'name'], width: 150 },
    { title: '生效日期', dataIndex: 'effectiveDate', width: 120, render: (v) => new Date(v).toLocaleDateString() },
    { title: '来源', dataIndex: 'source', width: 100 },
    { title: '备注', dataIndex: 'remark' },
  ]

  return (
    <div className="page-container">
      <div className="page-title">历史价格查询</div>

      <div className="table-toolbar">
        <div className="filter-section">
          <Input
            placeholder="物料名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 180 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="供应商"
            value={supplierId || undefined}
            onChange={(v) => setSupplierId(v)}
            style={{ width: 180 }}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {suppliers.map(s => (
              <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
        </div>
        <div className="action-section">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加价格</Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => fetchData(page, pageSize),
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="添加价格记录"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="supplierId" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
            <Select showSearch optionFilterProp="children">
              {suppliers.map(s => (
                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="materialName" label="物料名称" rules={[{ required: true, message: '请输入物料名称' }]}>
            <Input placeholder="请输入物料名称" />
          </Form.Item>
          <Form.Item name="specification" label="规格型号">
            <Input placeholder="请输入规格型号" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="unit" label="单位" style={{ flex: 1 }} rules={[{ required: true, message: '请输入单位' }]}>
              <Input placeholder="如:米、吨" />
            </Form.Item>
            <Form.Item name="price" label="价格" style={{ flex: 1 }} rules={[{ required: true, message: '请输入价格' }]}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="effectiveDate" label="生效日期" rules={[{ required: true, message: '请选择生效日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Input placeholder="如:询报价、招标" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PriceHistory
