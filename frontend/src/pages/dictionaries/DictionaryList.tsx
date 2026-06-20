import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Form, Select, Input, Space, Modal, message, Popconfirm, Tree } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { dictionaryApi, DictionaryCategory, DictionaryItem } from '../../api/dictionaries'
import { PaginatedResponse } from '../../api'

const DictionaryList: React.FC = () => {
  const [form] = Form.useForm()
  const [itemForm] = Form.useForm()
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [itemLoading, setItemLoading] = useState(false)
  const [categories, setCategories] = useState<PaginatedResponse<DictionaryCategory>>({ count: 0, next: null, previous: null, results: [] })
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [items, setItems] = useState<DictionaryItem[]>([])
  const [itemModalVisible, setItemModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async (keyword?: string, p: number = 1, ps: number = 100) => {
    setCategoryLoading(true)
    try {
      const params: any = { page: p, page_size: ps, ordering: 'code' }
      if (keyword) params.search = keyword
      const res = await dictionaryApi.list(params)
      setCategories(res)
      if (res.results.length > 0 && !selectedCategory) {
        loadItems(res.results[0].id)
      }
    } catch (e) {
    } finally {
      setCategoryLoading(false)
    }
  }

  const loadItems = async (categoryId: number) => {
    setSelectedCategory(categoryId)
    setItemLoading(true)
    try {
      const res = await dictionaryApi.getItems(categoryId)
      setItems(res)
    } catch (e) {
    } finally {
      setItemLoading(false)
    }
  }

  const onSearch = (values: any) => {
    loadCategories(values.keyword)
  }

  const handleOpenItemModal = (item?: DictionaryItem) => {
    setEditingItem(item || null)
    itemForm.setFieldsValue({
      name: item?.name || '',
      value: item?.value || '',
      sort_order: item?.sort_order || 0,
      is_enabled: item?.is_enabled ?? true,
      description: item?.description || '',
    })
    setItemModalVisible(true)
  }

  const handleSaveItem = async () => {
    try {
      const values = await itemForm.validateFields()
      if (editingItem) {
        await dictionaryApi.updateItem(editingItem.id, values)
        message.success('更新成功')
      } else {
        await dictionaryApi.createItem({ ...values, category: selectedCategory! })
        message.success('创建成功')
      }
      setItemModalVisible(false)
      if (selectedCategory) loadItems(selectedCategory)
    } catch (e) {}
  }

  const categoryColumns = [
    { title: '分类编码', dataIndex: 'code', width: 180 },
    { title: '分类名称', dataIndex: 'name', width: 180 },
    { title: '字典项数', dataIndex: 'items_count', width: 100 },
    {
      title: '是否启用', dataIndex: 'is_enabled', width: 90,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '停用'}</Tag>
    },
    { title: '描述', dataIndex: 'description', ellipsis: true },
  ]

  const itemColumns = [
    { title: '排序', dataIndex: 'sort_order', width: 70 },
    { title: '字典项名称', dataIndex: 'name', width: 200 },
    { title: '字典项值', dataIndex: 'value', width: 160 },
    {
      title: '启用', dataIndex: 'is_enabled', width: 70,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>
    },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '操作', width: 120,
      render: (_: any, r: DictionaryItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleOpenItemModal(r)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={async () => {
            try { await dictionaryApi.deleteItem(r.id); message.success('已删除'); if (selectedCategory) loadItems(selectedCategory) } catch (e) {}
          }}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>字典管理</h2>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 380 }}>
          <div className="detail-section-title" style={{ marginTop: 0 }}>字典分类</div>
          <div className="filter-bar" style={{ marginBottom: 8 }}>
            <Form form={form} layout="inline" onFinish={onSearch}>
              <Form.Item name="keyword">
                <Input placeholder="搜索分类" style={{ width: 180 }} allowClear />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" size="small">查询</Button>
              </Form.Item>
            </Form>
          </div>
          <Table
            loading={categoryLoading}
            columns={categoryColumns}
            dataSource={categories.results}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 500 }}
            rowClassName={(r) => selectedCategory === r.id ? 'ant-table-row-selected' : ''}
            onRow={(r) => ({ onClick: () => loadItems(r.id), style: { cursor: 'pointer' } })}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="detail-section-title" style={{ margin: 0 }}>
              字典项 {selectedCategory ? `(${categories.results.find(c => c.id === selectedCategory)?.name || ''})` : ''}
            </div>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              disabled={!selectedCategory}
              onClick={() => handleOpenItemModal()}
            >
              新增字典项
            </Button>
          </div>
          <Table
            loading={itemLoading}
            columns={itemColumns}
            dataSource={items}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ y: 500 }}
          />
        </div>
      </div>

      <Modal
        title={editingItem ? '编辑字典项' : '新增字典项'}
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        onOk={handleSaveItem}
        okText="保存"
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item name="name" label="字典项名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="value" label="字典项值" rules={[{ required: true, message: '请输入值' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="is_enabled" label="启用" valuePropName="checked">
            <Select>
              <Select.Option value={true}>是</Select.Option>
              <Select.Option value={false}>否</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DictionaryList
