import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, message, Space, Tabs } from 'antd'
import { EyeOutlined, CheckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getPriceAlerts, reviewPriceAlert } from '../../services/api'

const PriceAlert = () => {
  const [pendingData, setPendingData] = useState([])
  const [reviewedData, setReviewedData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentAlert, setCurrentAlert] = useState(null)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await getPriceAlerts({ isReviewed: false, pageSize: 100 })
      setPendingData(res.list)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviewed = async () => {
    setLoading(true)
    try {
      const res = await getPriceAlerts({ isReviewed: true, pageSize: 50 })
      setReviewedData(res.list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleReview = (record) => {
    setCurrentAlert(record)
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await reviewPriceAlert(currentAlert.id, values)
      message.success('复盘完成')
      setModalVisible(false)
      fetchPending()
      fetchReviewed()
    } catch (e) {}
  }

  const columns = [
    { title: '物料名称', dataIndex: 'materialName', width: 150 },
    {
      title: '历史价格',
      dataIndex: 'oldPrice',
      width: 120,
      render: (v) => `¥${Number(v).toLocaleString()}`,
    },
    {
      title: '当前价格',
      dataIndex: 'newPrice',
      width: 120,
      render: (v) => `¥${Number(v).toLocaleString()}`,
    },
    {
      title: '波动幅度',
      dataIndex: 'fluctuation',
      width: 120,
      render: (v) => (
        <Tag color={v > 0 ? 'red' : 'green'}>
          {v > 0 ? '↑' : '↓'} {Math.abs(v)}%
        </Tag>
      ),
    },
    { title: '关联需求', dataIndex: ['request', 'requestNo'], width: 150 },
    { title: '项目名称', dataIndex: ['request', 'title'], ellipsis: true },
    {
      title: '状态',
      dataIndex: 'isReviewed',
      width: 100,
      render: (v) => v ? <Tag color="success">已复盘</Tag> : <Tag color="warning">待复盘</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, render: (v) => new Date(v).toLocaleString() },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/purchase-requests/${record.requestId}`)}
          >
            查看需求
          </Button>
          {!record.isReviewed && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleReview(record)}
            >
              复盘
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>价格波动提醒</span>
        <Space>
          <Button onClick={() => navigate('/price/history')}>历史价格</Button>
          <Button onClick={() => navigate('/price/review')}>复盘记录</Button>
        </Space>
      </div>

      <Tabs
        defaultActiveKey="pending"
        onChange={(key) => {
          if (key === 'pending') fetchPending()
          else fetchReviewed()
        }}
        items={[
          {
            key: 'pending',
            label: `待复盘 (${pendingData.length})`,
            children: (
              <Table
                columns={columns}
                dataSource={pendingData}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1000 }}
              />
            ),
          },
          {
            key: 'reviewed',
            label: '已复盘',
            children: (
              <Table
                columns={columns}
                dataSource={reviewedData}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1000 }}
              />
            ),
          },
        ]}
      />

      <Modal
        title="价格复盘"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="提交复盘"
        cancelText="取消"
        width={500}
      >
        {currentAlert && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <p><strong>物料名称：</strong>{currentAlert.materialName}</p>
            <p><strong>历史价格：</strong>¥{Number(currentAlert.oldPrice).toLocaleString()}</p>
            <p><strong>当前价格：</strong>¥{Number(currentAlert.newPrice).toLocaleString()}</p>
            <p><strong>波动幅度：</strong>
              <span style={{ color: currentAlert.fluctuation > 0 ? '#f5222d' : '#52c41a' }}>
                {currentAlert.fluctuation > 0 ? '+' : ''}{currentAlert.fluctuation}%
              </span>
            </p>
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="conclusion"
            label="复盘结论"
            rules={[{ required: true, message: '请输入复盘结论' }]}
          >
            <Select>
              <Select.Option value="reasonable">价格合理，继续执行</Select.Option>
              <Select.Option value="need_negotiate">需与供应商议价</Select.Option>
              <Select.Option value="find_supplier">需寻找替代供应商</Select.Option>
              <Select.Option value="adjust_quantity">建议调整采购数量</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="suggestion" label="处理建议">
            <Input.TextArea rows={3} placeholder="请输入处理建议" />
          </Form.Item>
          <Form.Item name="reviewNote" label="复盘说明">
            <Input.TextArea rows={3} placeholder="请输入复盘说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PriceAlert
