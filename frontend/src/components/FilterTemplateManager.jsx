import React, { useState, useEffect } from 'react'
import { Button, Modal, Form, Input, Select, message, Dropdown, Space } from 'antd'
import { SaveOutlined, FolderOpenOutlined, DownOutlined } from '@ant-design/icons'
import { filterApi } from '@/services/api'

export default function FilterTemplateManager({ pageCode, pageName, filters, onApplyTemplate, onSaveSuccess }) {
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [templates, setTemplates] = useState([])
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [pageCode])

  const loadTemplates = async () => {
    try {
      const data = await filterApi.getMyTemplates(pageCode)
      setTemplates(data || [])
    } catch (error) {
      console.error('加载模板失败', error)
    }
  }

  const handleSave = async (values) => {
    setLoading(true)
    try {
      await filterApi.create({
        templateName: values.templateName,
        pageCode,
        pageName,
        filterConditions: JSON.stringify(filters),
        description: values.description,
        isPublic: values.isPublic || false,
      })
      message.success('筛选条件已保存')
      setSaveModalOpen(false)
      form.resetFields()
      loadTemplates()
      if (onSaveSuccess) onSaveSuccess()
    } catch (error) {
      console.error('保存失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (templateId) => {
    try {
      const data = await filterApi.useTemplate(templateId)
      if (data?.filterConditions) {
        try {
          const conditions = JSON.parse(data.filterConditions)
          if (onApplyTemplate) {
            onApplyTemplate(conditions)
            message.success(`已应用模板: ${data.templateName}`)
          }
        } catch (e) {
          message.error('模板数据解析失败')
        }
      }
    } catch (error) {
      console.error('应用模板失败', error)
    }
  }

  const handleRename = async (templateId) => {
    Modal.confirm({
      title: '重命名模板',
      content: (
        <Form initialValues={{}}>
          <Form.Item
            label="新名称"
            name="newName"
            rules={[{ required: true, message: '请输入新名称' }]}
          >
            <Input placeholder="请输入新名称" id="renameInput" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const newName = document.getElementById('renameInput')?.value
        if (!newName) {
          message.error('请输入新名称')
          return Promise.reject()
        }
        await filterApi.rename(templateId, newName)
        message.success('重命名成功')
        loadTemplates()
      },
    })
  }

  const handleDelete = async (templateId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此筛选模板吗？',
      onOk: async () => {
        await filterApi.delete(templateId)
        message.success('删除成功')
        loadTemplates()
      },
    })
  }

  const templateMenu = {
    items: templates.length > 0
      ? templates.map((t) => ({
          key: t.id,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t.templateName} <span style={{ color: '#999', fontSize: 12 }}>(使用 {t.useCount} 次)</span></span>
              <Space>
                <Button
                  type="text"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRename(t.id)
                  }}
                >
                  重命名
                </Button>
                <Button
                  type="text"
                  size="small"
                  danger
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(t.id)
                  }}
                >
                  删除
                </Button>
              </Space>
            </div>
          ),
          onClick: () => handleApply(t.id),
        }))
      : [{ key: 'empty', label: '暂无保存的模板', disabled: true }],
  }

  return (
    <>
      <Space>
        <Dropdown menu={templateMenu} trigger={['click']}>
          <Button icon={<FolderOpenOutlined />}>
            应用模板 <DownOutlined />
          </Button>
        </Dropdown>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => setSaveModalOpen(true)}
        >
          保存筛选
        </Button>
      </Space>

      <Modal
        title="保存筛选条件"
        open={saveModalOpen}
        onCancel={() => setSaveModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            label="模板名称"
            name="templateName"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称，便于后续复用" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} placeholder="可选，描述此筛选条件的用途" />
          </Form.Item>
          <Form.Item label="共享设置" name="isPublic" valuePropName="checked">
            <Select>
              <Select.Option value={false}>仅自己可见</Select.Option>
              <Select.Option value={true}>公开给所有用户</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSaveModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
