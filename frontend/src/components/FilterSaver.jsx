import React, { useState, useEffect } from 'react'
import { Button, Dropdown, Modal, Form, Input, Switch, Select, message, Space, Tag } from 'antd'
import { FilterOutlined, PlusOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons'
import { filterAPI } from '../services/api.js'

const { Option } = Select

function FilterSaver({ pageKey, filterData, onApply }) {
  const [filters, setFilters] = useState([])
  const [roleDefaultFilter, setRoleDefaultFilter] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserRole(user.role || '')
  }, [])

  useEffect(() => {
    loadFilters()
  }, [pageKey, userRole])

  const loadFilters = async () => {
    try {
      const data = await filterAPI.getList(pageKey, userRole)
      setFilters(data.filters || [])
      setRoleDefaultFilter(data.roleDefaultFilter || null)
      const personalDefault = (data.filters || []).find(f => f.isDefault)
      const filterToApply = personalDefault || data.roleDefaultFilter
      if (filterToApply && onApply) {
        onApply(filterToApply.filterData)
      }
    } catch (e) {}
  }

  const handleSave = async (values) => {
    try {
      await filterAPI.create({
        pageKey,
        name: values.name,
        filterData,
        isDefault: values.isDefault,
        roleDefault: values.isRoleDefault ? userRole : null
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

  const roleLabelMap = {
    ORGANIZER: '主办方',
    INTERNAL: '内部运营',
    ADMIN: '管理员'
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
    { type: 'divider' }
  ]

  if (roleDefaultFilter) {
    menuItems.push({
      key: 'roleDefault',
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 220 }}>
          <span
            onClick={(e) => { e.stopPropagation(); onApply && onApply(roleDefaultFilter.filterData) }}
            style={{ flex: 1 }}
          >
            <TeamOutlined style={{ color: '#722ed1' }} />
            <Tag color="purple" style={{ marginLeft: 4 }}>{roleLabelMap[roleDefaultFilter.roleDefault] || roleDefaultFilter.roleDefault}</Tag>
            {roleDefaultFilter.name}
          </span>
          <DeleteOutlined
            style={{ color: '#ff4d4f' }}
            onClick={(e) => { e.stopPropagation(); handleDelete(roleDefaultFilter.id) }}
          />
        </div>
      )
    })
  }

  filters.forEach(f => {
    menuItems.push({
      key: f.id,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 220 }}>
          <span
            onClick={(e) => { e.stopPropagation(); onApply && onApply(f.filterData) }}
            style={{ flex: 1 }}
          >
            {f.isDefault && <span style={{ color: '#1890ff' }}>★ </span>}
            {f.roleDefault && <Tag color="purple" style={{ marginRight: 4 }}>{roleLabelMap[f.roleDefault] || f.roleDefault}</Tag>}
            {f.name}
          </span>
          <DeleteOutlined
            style={{ color: '#ff4d4f' }}
            onClick={(e) => { e.stopPropagation(); handleDelete(f.id) }}
          />
        </div>
      )
    })
  })

  if (filters.length === 0 && !roleDefaultFilter) {
    menuItems.length = 2
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
          <Form.Item name="isDefault" label="设为个人默认" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isRoleDefault" label="设为角色默认" valuePropName="checked" extra={`当前角色：${roleLabelMap[userRole] || userRole}，设为角色默认后同角色用户将自动加载此筛选条件`}>
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
