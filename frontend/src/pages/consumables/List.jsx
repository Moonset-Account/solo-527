import React, { useEffect, useState } from 'react'
import { Table, Button, Input, Select, Tag, Space, Modal, Form, Upload, message, Popconfirm, Drawer, Descriptions, Image } from 'antd'
import { PlusOutlined, UploadOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { consumableApi } from '@/api/endpoints'
import SavedFilterBar from '@/components/SavedFilterBar'
import dayjs from 'dayjs'

function ConsumableList() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({})
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [batchModal, setBatchModal] = useState(false)
  const [categories, setCategories] = useState([])
  const [queryForm] = Form.useForm()
  const [batchForm] = Form.useForm()

  const loadCategories = async () => {
    try {
      const res = await consumableApi.categories.all()
      setCategories(res.data.results || res.data)
    } catch (e) {}
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page: pagination.current, page_size: pagination.pageSize }
      const res = await consumableApi.specifications.list(params)
      setData(res.data.results || res.data)
      setPagination(p => ({ ...p, total: res.data.count || (res.data.results || res.data).length }))
    } catch (e) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadData()
  }, [filters, pagination.current, pagination.pageSize])

  const handleSearch = () => {
    const values = queryForm.getFieldsValue()
    setFilters({ ...filters, ...Object.fromEntries(Object.entries(values).filter(([_, v]) => v)) })
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleDelete = async (id) => {
    try {
      await consumableApi.specifications.delete(id)
      message.success('删除成功')
      loadData()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const handleBatchQuery = async (values) => {
    try {
      const res = await consumableApi.specifications.batchQueryWithAttachments(values)
      setData(res.data)
      setBatchModal(false)
      message.success(`查询到 ${res.data.length} 条记录`)
    } catch (e) {
      message.error('查询失败')
    }
  }

  const openDetail = async (item) => {
    try {
      const res = await consumableApi.specifications.detail(item.id)
      setCurrentItem(res.data)
      setDetailDrawer(true)
    } catch (e) {}
  }

  const getStatusTag = (status) => {
    const colors = { active: 'green', inactive: 'orange', obsolete: 'red' }
    const labels = { active: '在用', inactive: '停用', obsolete: '淘汰' }
    return <Tag color={colors[status]}>{labels[status]}</Tag>
  }

  const columns = [
    { title: '品类', dataIndex: 'category_name', key: 'category_name' },
    { title: '耗材名称', dataIndex: 'name', key: 'name' },
    { title: '规格型号', dataIndex: 'specification', key: 'specification' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '单位', dataIndex: 'unit_display', key: 'unit_display' },
    { title: '单价(元)', dataIndex: 'unit_price', key: 'unit_price' },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '附件数', dataIndex: 'attachments', key: 'attachments', render: v => v?.length || 0 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: v => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '操作', key: 'action', width: 180,
      render: (_, r) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/consumables/${r.id}/edit`)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">耗材规格管理</h2>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setBatchModal(true)}>批量查询</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/consumables/new')}>新增耗材</Button>
        </Space>
      </div>

      <SavedFilterBar module="consumables" filters={filters} setFilters={setFilters} />

      <Form form={queryForm} layout="inline" className="filter-bar" onFinish={handleSearch}>
        <Form.Item name="search">
          <Input placeholder="搜索名称/规格/品牌" prefix={<SearchOutlined />} allowClear />
        </Form.Item>
        <Form.Item name="category">
          <Select placeholder="选择品类" allowClear style={{ width: 150 }}
            options={categories.map(c => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item name="status">
          <Select placeholder="状态" allowClear style={{ width: 120 }}
            options={[
              { value: 'active', label: '在用' },
              { value: 'inactive', label: '停用' },
              { value: 'obsolete', label: '淘汰' }
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">查询</Button>
        </Form.Item>
      </Form>

      <Table
        loading={loading}
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: t => `共 ${t} 条` }}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        onChange={(p) => setPagination({ ...pagination, current: p.current, pageSize: p.pageSize })}
      />

      <Drawer title="耗材详情" width={720} open={detailDrawer} onClose={() => setDetailDrawer(false)}>
        {currentItem && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="耗材名称">{currentItem.name}</Descriptions.Item>
              <Descriptions.Item label="规格型号">{currentItem.specification}</Descriptions.Item>
              <Descriptions.Item label="品类">{currentItem.category_name}</Descriptions.Item>
              <Descriptions.Item label="品牌">{currentItem.brand}</Descriptions.Item>
              <Descriptions.Item label="单位">{currentItem.unit_display}</Descriptions.Item>
              <Descriptions.Item label="单价">{currentItem.unit_price} 元</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentItem.status)}</Descriptions.Item>
              <Descriptions.Item label="创建人">{currentItem.created_by_name}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{currentItem.description}</Descriptions.Item>
            </Descriptions>
            <h4 style={{ marginTop: 24, marginBottom: 12 }}>规格附件 ({currentItem.attachments?.length || 0})</h4>
            {currentItem.attachments?.map(a => (
              <div key={a.id} style={{ marginBottom: 8, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                <a href={a.file_url} target="_blank" rel="noreferrer">{a.file_name}</a>
                <span style={{ color: '#999', marginLeft: 12, fontSize: 12 }}>{dayjs(a.created_at).format('YYYY-MM-DD')}</span>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      <Modal title="批量查询规格" open={batchModal} onCancel={() => setBatchModal(false)} footer={null} width={500}>
        <Form form={batchForm} layout="vertical" onFinish={handleBatchQuery}>
          <Form.Item label="品类(多选)" name="categories">
            <Select mode="multiple" placeholder="选择品类"
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item label="品牌(多个用逗号分隔)" name="brands">
            <Select mode="tags" placeholder="输入品牌名" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">查询</Button>
            <Button onClick={() => setBatchModal(false)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ConsumableList
