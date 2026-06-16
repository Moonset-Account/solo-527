import React, { useState, useEffect } from 'react'
import { Button, Dropdown, Modal, Form, Input, Switch, message, Space } from 'antd'
import { FilterOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { filterAPI } from '../services/api.js'

function FilterSaver({ pageKey, filterData, onApply }) {
  const [filters, setFilters] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadFilters()
  }, [pageKey])

  const loadFilters = async () => {
    try {
      const data = await filterAPI.getList(pageKey)
      setFilters(data)
      const defaultFilter = data.find(f => f.isDefault)
      if (defaultFilter && onApply) {
        onApply(defaultFilter.filterData)
      }
    } catch (e) {}
  }

  const handleSave = async (values) => {
    try {
      await filterAPI.create({
        pageKey,
        name: values.name,
        filterData,
        isDefault: values.isDefault
      })
      message.success('保存成功')
      setModalVisible(false)
      form.resetFields()
      loadFilters()
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    try {
      await filterAPI.remove(id)
      message.success('删除成功')
      loadFilters()
    } catch (e) {}
  }

  const menuItems = [
    {
      key: 'save',
      label: (
        <span onClick={() => setModalVisible(true)}>
          <PlusOutlined /> 保存当前过滤条件
        </span>
      )
    },
    { type: 'divider' },
    ...filters.map(f => ({
      key: f.id,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 200 }}>
          <span
            onClick={(e) => {
              e.stopPropagation()
              onApply && onApply(f.filterData)
            }}
            style={{ flex: 1 }}
          >
            {f.isDefault && <span style={{ color: '#1890ff' }}>★ </span>}
            {f.name}
          </span>
          <DeleteOutlined
            style={{ color: '#ff4d4f' }}
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(f.id)
            }}
          />
        </div>
      )
    }))
  ]

  if (filters.length === 0) {
    menuItems.length = 1
    menuItems.push({
      key: 'empty',
      label: <span style={{ color: '#999' }}>暂无保存的过滤项</span>
    })
  }

  return (
    <>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button icon={<FilterOutlined />}>
          常用筛选
        </Button>
      </Dropdown>
      <Modal
        title="保存过滤条件"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="过滤名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入过滤条件名称" />
          </Form.Item>
          <Form.Item name="isDefault" label="设为默认" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default FilterSaver
