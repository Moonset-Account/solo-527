import React, { useState, useEffect } from 'react'
import { Button, Dropdown, Modal, Form, Input, Checkbox, message, Tooltip, Tag, Space, Popconfirm } from 'antd'
import { StarOutlined, StarFilled, FilterOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import { savedFilterApi } from '@/api/endpoints'

function SavedFilterBar({ module, filters, setFilters, defaultFilters = {}, onFilterChange }) {
  const [savedFilters, setSavedFilters] = useState([])
  const [saveModal, setSaveModal] = useState(false)
  const [form] = Form.useForm()

  const loadSavedFilters = async () => {
    if (!module) return
    try {
      const res = await savedFilterApi.list({ module })
      setSavedFilters(res.data.results || res.data)
    } catch (e) {}
  }

  useEffect(() => {
    loadSavedFilters()
  }, [module])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      await savedFilterApi.create({
        module,
        name: values.name,
        filter_params: filters,
        is_shared: values.is_shared || false
      })
      message.success('筛选条件已保存，值班人员可在"共享筛选"中复用')
      setSaveModal(false)
      form.resetFields()
      loadSavedFilters()
    } catch (e) {
      message.error('保存失败')
    }
  }

  const handleApply = (filterParams) => {
    setFilters({ ...filterParams })
    if (onFilterChange) onFilterChange({ ...filterParams })
    message.success('已应用筛选条件')
  }

  const handleReset = () => {
    setFilters({ ...defaultFilters })
    if (onFilterChange) onFilterChange({ ...defaultFilters })
    message.info('已重置筛选条件')
  }

  const handleDelete = async (id) => {
    try {
      await savedFilterApi.delete(id)
      message.success('已删除')
      loadSavedFilters()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const savedMenu = {
    items: savedFilters.length > 0 ? savedFilters.map((f) => ({
      key: f.id,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 240 }}>
          <span
            onClick={() => handleApply(f.filter_params)}
            style={{ flex: 1, cursor: 'pointer', padding: '4px 0' }}
          >
            <StarFilled style={{ color: f.is_shared ? '#1677ff' : '#faad14', marginRight: 6 }} />
            {f.is_shared && <Tag color="blue" style={{ marginRight: 6 }}>共享</Tag>}
            {f.name}
          </span>
          <Popconfirm title="确定删除该筛选条件？" onConfirm={() => handleDelete(f.id)}>
            <DeleteOutlined
              onClick={(e) => e.stopPropagation()}
              style={{ color: '#ff4d4f', cursor: 'pointer', marginLeft: 8 }}
            />
          </Popconfirm>
        </div>
      )
    })) : [{ key: 'empty', label: <span style={{ color: '#999', padding: 8 }}>暂无保存的筛选</span>, disabled: true }]
  }

  return (
    <Space style={{ marginBottom: 16, flexWrap: 'wrap' }} size="small">
      <Dropdown menu={savedMenu} trigger={['click']}>
        <Button icon={<StarFilled style={{ color: '#faad14' }} />}>
          我的筛选 {savedFilters.length > 0 && `(${savedFilters.length})`}
        </Button>
      </Dropdown>
      <Tooltip title="保存当前筛选条件，可选共享给值班人员每日复用">
        <Button icon={<SaveOutlined />} onClick={() => setSaveModal(true)}>
          保存筛选
        </Button>
      </Tooltip>
      <Button onClick={handleReset} icon={<FilterOutlined />}>重置</Button>

      <Modal title="保存筛选条件" open={saveModal} onCancel={() => setSaveModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="筛选名称" name="name" rules={[{ required: true, message: '请输入筛选名称' }]}>
            <Input placeholder="如：本月高风险供应商 / 即将到期合同" />
          </Form.Item>
          <Form.Item name="is_shared" valuePropName="checked">
            <Checkbox>
              共享给其他同事（值班人员可每日复用）
            </Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => setSaveModal(false)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

export default SavedFilterBar
