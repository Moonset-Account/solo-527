import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Select, Modal, Form, Input, InputNumber, Tag, App, Popconfirm, Card } from 'antd'
import { PlusOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { reworkApi, processFlowApi } from '../services/api'

const { Option } = Select
const { TextArea } = Input

const Rework = () => {
  const [data, setData] = useState([])
  const [processFlows, setProcessFlows] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [handledFilter, setHandledFilter] = useState('')
  const { message, modal } = App.useApp()

  useEffect(() => {
    fetchData()
    fetchProcessFlows()
  }, [handledFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (handledFilter !== '') params.handled = handledFilter
      const res = await reworkApi.getList(params)
      if (res.code === 200) setData(res.data)
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchProcessFlows = async () => {
    const res = await processFlowApi.getList({ status: 'COMPLETED' })
    if (res.code === 200) setProcessFlows(res.data)
  }

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const res = await reworkApi.create(values)
      if (res.code === 200) {
        message.success('返工记录创建成功')
        setModalVisible(false)
        fetchData()
      } else {
        message.error(res.message)
      }
    } catch (e) {
      if (e.errorFields) return
      message.error('保存失败')
    }
  }

  const handleRework = async (record) => {
    modal.confirm({
      title: '确认处理',
      content: `确定要处理该返工记录吗？`,
      onOk: async () => {
        const res = await reworkApi.handle(record.id, { remark: '已处理' })
        if (res.code === 200) {
          message.success('处理成功')
          fetchData()
        } else {
          message.error(res.message)
        }
      },
    })
  }

  const columns = [
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '设备',
      key: 'equipment',
      render: (_, r) => r.processFlow?.equipment?.name || '-',
    },
    {
      title: '工序',
      key: 'process',
      render: (_, r) => r.processFlow?.process?.name || '-',
    },
    {
      title: '计划编号',
      key: 'plan',
      render: (_, r) => r.processFlow?.plan?.planNo || '-',
    },
    {
      title: '产品',
      key: 'product',
      render: (_, r) => r.processFlow?.plan?.workOrder?.productName || '-',
    },
    {
      title: '返工原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '返工数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '状态',
      dataIndex: 'handled',
      key: 'handled',
      render: (h) =>
        h ? (
          <Tag color="success">已处理</Tag>
        ) : (
          <Tag color="warning">待处理</Tag>
        ),
    },
    {
      title: '处理人',
      dataIndex: 'handledBy',
      key: 'handledBy',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {!record.handled && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleRework(record)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">返工管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增返工
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select
            placeholder="状态筛选"
            value={handledFilter === '' ? undefined : handledFilter}
            onChange={setHandledFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="false">待处理</Option>
            <Option value="true">已处理</Option>
          </Select>
          <Button onClick={fetchData}>刷新</Button>
        </Space>
      </Card>

      {data.filter((d) => !d.handled).length > 0 && (
        <Card
          style={{ marginBottom: 16, borderColor: '#faad14' }}
          title={
            <Space>
              <WarningOutlined style={{ color: '#faad14' }} />
              <span>待处理返工提醒</span>
            </Space>
          }
        >
          <p style={{ margin: 0, color: '#d48806' }}>
            当前有 {data.filter((d) => !d.handled).length} 条返工记录待处理，请及时处理！
          </p>
        </Card>
      )}

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新增返工记录"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="processFlowId"
            label="工序流转"
            rules={[{ required: true, message: '请选择工序流转' }]}
          >
            <Select placeholder="请选择工序流转" showSearch optionFilterProp="label">
              {processFlows.map((pf) => (
                <Option
                  key={pf.id}
                  value={pf.id}
                  label={`${pf.equipment?.name} - ${pf.process?.name} - ${pf.plan?.planNo}`}
                >
                  {pf.equipment?.name} - {pf.process?.name} - {pf.plan?.planNo}（
                  {pf.plan?.workOrder?.productName}）
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="返工原因"
            rules={[{ required: true, message: '请输入返工原因' }]}
          >
            <Select placeholder="请选择或输入返工原因">
              <Option value="尺寸不良">尺寸不良</Option>
              <Option value="外观缺陷">外观缺陷</Option>
              <Option value="缺胶">缺胶</Option>
              <Option value="毛边">毛边</Option>
              <Option value="变形">变形</Option>
              <Option value="色差">色差</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="返工数量"
            rules={[{ required: true, message: '请输入返工数量' }]}
            initialValue={1}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入返工数量" />
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <TextArea rows={3} placeholder="请输入详细描述" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Rework
