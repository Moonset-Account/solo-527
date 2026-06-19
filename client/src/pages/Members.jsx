import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag, Statistic, Card, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { getMembers, createMember, updateMember, deleteMember, getMember } from '../services/api'
import dayjs from 'dayjs'

function Members() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const res = await getMembers({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...values
      })
      setList(res.list)
      setTotal(res.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }))
    setTimeout(loadData, 0)
  }

  const handleReset = () => {
    filterForm.resetFields()
    setPagination(p => ({ ...p, current: 1 }))
    setTimeout(loadData, 0)
  }

  const handleAdd = () => {
    setCurrentRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = record => {
    setCurrentRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDetail = async record => {
    try {
      const data = await getMember(record.id)
      setDetailData(data)
      setDetailVisible(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async id => {
    try {
      await deleteMember(id)
      message.success('删除成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async values => {
    try {
      const data = { ...values }
      if (data.totalSpent) data.totalSpent = String(data.totalSpent)
      if (currentRecord) {
        await updateMember(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createMember(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const levelColors = {
    NORMAL: 'default',
    SILVER: 'blue',
    GOLD: 'gold',
    PLATINUM: 'purple',
    DIAMOND: 'magenta'
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '会员姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '会员等级',
      dataIndex: 'level',
      key: 'level',
      render: l => <Tag color={levelColors[l] || 'default'}>{l}</Tag>
    },
    { title: '累计消费', dataIndex: 'totalSpent', key: 'totalSpent', render: v => `¥${v}` },
    { title: '留存天数', dataIndex: 'retentionDays', key: 'retentionDays', render: v => `${v}天` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => <Tag color={s === 'ACTIVE' ? 'green' : 'default'}>{s}</Tag>
    },
    { title: '最近活跃', dataIndex: 'lastActiveDate', key: 'lastActiveDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(r)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const stats = [
    { title: '会员总数', value: total, color: '#1890ff' },
    { title: '活跃会员', value: list.filter(m => m.status === 'ACTIVE').length, color: '#52c41a' },
    { title: 'VIP会员', value: list.filter(m => m.level === 'GOLD' || m.level === 'PLATINUM' || m.level === 'DIAMOND').length, color: '#faad14' }
  ]

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>会员管理</h2>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {stats.map((s, i) => (
          <Col span={8} key={i}>
            <Card>
              <Statistic title={s.title} value={s.value} valueStyle={{ color: s.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      <div className="filter-bar">
        <Form form={filterForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="姓名/手机/邮箱" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="level" label="等级">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value="NORMAL">普通</Select.Option>
              <Select.Option value="SILVER">白银</Select.Option>
              <Select.Option value="GOLD">黄金</Select.Option>
              <Select.Option value="PLATINUM">铂金</Select.Option>
              <Select.Option value="DIAMOND">钻石</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value="ACTIVE">活跃</Select.Option>
              <Select.Option value="INACTIVE">不活跃</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">搜索</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增会员</Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{
          ...pagination,
          total,
          showTotal: t => `共 ${t} 条`,
          showSizeChanger: true
        }}
        onChange={pag => setPagination({ current: pag.current, pageSize: pag.pageSize })}
      />

      <Modal
        title={currentRecord ? '编辑会员' : '新增会员'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="会员姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="level" label="会员等级" initialValue="NORMAL">
            <Select>
              <Select.Option value="NORMAL">普通会员</Select.Option>
              <Select.Option value="SILVER">白银会员</Select.Option>
              <Select.Option value="GOLD">黄金会员</Select.Option>
              <Select.Option value="PLATINUM">铂金会员</Select.Option>
              <Select.Option value="DIAMOND">钻石会员</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="ACTIVE">
            <Select>
              <Select.Option value="ACTIVE">活跃</Select.Option>
              <Select.Option value="INACTIVE">不活跃</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="totalSpent" label="累计消费">
            <Input style={{ width: '100%' }} placeholder="请输入累计消费金额" prefix="¥" />
          </Form.Item>
          <Form.Item name="retentionDays" label="留存天数">
            <Input placeholder="请输入留存天数" suffix="天" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="会员详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {detailData && (
          <div>
            <p><strong>姓名：</strong>{detailData.name}</p>
            <p><strong>手机号：</strong>{detailData.phone || '-'}</p>
            <p><strong>邮箱：</strong>{detailData.email || '-'}</p>
            <p><strong>等级：</strong>{detailData.level}</p>
            <p><strong>状态：</strong>{detailData.status}</p>
            <p><strong>累计消费：</strong>¥{detailData.totalSpent}</p>
            <p><strong>留存天数：</strong>{detailData.retentionDays}天</p>
            <p><strong>最近活跃：</strong>{detailData.lastActiveDate ? dayjs(detailData.lastActiveDate).format('YYYY-MM-DD') : '-'}</p>
            
            <h4 style={{ marginTop: 16 }}>订阅记录</h4>
            {detailData.subscriptions?.length > 0 ? (
              <Table size="small" dataSource={detailData.subscriptions} rowKey="id" pagination={false}>
                <Table.Column title="套餐名称" dataIndex="planName" />
                <Table.Column title="套餐类型" dataIndex="planType" render={t => <Tag>{t}</Tag>} />
                <Table.Column title="金额" dataIndex="amount" render={v => `¥${v}`} />
                <Table.Column title="状态" dataIndex="status" render={s => <Tag color={s === 'ACTIVE' ? 'green' : 'default'}>{s}</Tag>} />
                <Table.Column title="开始日期" dataIndex="startDate" render={t => t ? dayjs(t).format('YYYY-MM-DD') : '-'} />
                <Table.Column title="结束日期" dataIndex="endDate" render={t => t ? dayjs(t).format('YYYY-MM-DD') : '-'} />
              </Table>
            ) : <p>暂无订阅记录</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Members
