import React, { useState, useEffect } from 'react'
import { Button, Dropdown, Modal, Form, Input, Select, message, Tooltip, Tag, Space } from 'antd'
import { StarOutlined, StarFilled, FilterOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import { dashboardApi } from '@/api/endpoints'

function SavedFilterBar({ module, filters, setFilters, defaultFilters = {} }) {
  const [savedFilters, setSavedFilters] = useState([])
  const [saveModal, setSaveModal] = useState(false)
  const [form] = Form.useForm()

  const loadSavedFilters = async () => {
    try {
      const res = await dashboardApi.savedFilters.list({ module })
      setSavedFilters(res.data.results || res.data)
    } catch (e) {}
  }

  useEffect(() => {
    loadSavedFilters()
  }, [module])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      await dashboardApi.savedFilters.create({
        module,
        name: values.name,
        filter_params: filters,
        is_shared: values.is_shared || false
      })
      message.success('筛选条件已保存')
      setSaveModal(false)
      form.resetFields()
      loadSavedFilters()
    } catch (e) {
      message.error('保存失败')
    }
  }

  const handleApply = (filterParams) => {
    setFilters({ ...filterParams })
    message.success('已应用筛选条件')
  }

  const handleReset = () => {
    setFilters({ ...defaultFilters })
    message.info('已重置筛选条件')
  }

  const handleDelete = async (id) => {
    try {
      await dashboardApi.savedFilters.delete(id)
      message.success('已删除')
      loadSavedFilters()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const savedMenu = {
    items: savedFilters.map((f) => ({
      key: f.id,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 200 }}>
          <span onClick={() => handleApply(f.filter_params)} style={{ flex: 1, cursor: 'pointer' }}>
            {f.is_shared && <Tag color="blue">共享</Tag>} {f.name}
          </span>
          <DeleteOutlined
            onClick={(e) => { e.stopPropagation(); handleDelete(f.id) }}
            style={{ color: '#ff4d4f', cursor: 'pointer' }}
          />
        </div>
      )
    }))
  }

  return (
    <Space style={{ marginBottom: 16 }}>
      <Dropdown menu={savedMenu} trigger={['click']}>
        <Button icon={<StarOutlined />}>
          我的筛选
        </Button>
      </Dropdown>
      <Tooltip title="保存当前筛选条件">
        <Button icon={<SaveOutlined />} onClick={() => setSaveModal(true)}>
          保存筛选
        </Button>
      </Tooltip>
      <Button onClick={handleReset}>重置</Button>

      <Modal title="保存筛选条件" open={saveModal} onCancel={() => setSaveModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="筛选名称" name="name" rules={[{ required: true, message: '请输入筛选名称' }]}>
            <Input placeholder="如：本月高风险供应商" />
          </Form.Item>
          <Form.Item name="is_shared" valuePropName="checked">
            <Select
              mode="multiple"
              placeholder="可选：共享给其他同事"
              options={[{ value: true, label: '共享给所有人' }]}
            />
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
