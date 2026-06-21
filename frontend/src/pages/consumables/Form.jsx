import React, { useEffect, useState } from 'react'
import { Form, Input, Select, InputNumber, Button, Upload, message, Card, Space } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons'
import { consumableApi } from '@/api/endpoints'
import dayjs from 'dayjs'

function ConsumableForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [fileList, setFileList] = useState([])

  const loadCategories = async () => {
    try {
      const res = await consumableApi.categories.all()
      setCategories(res.data.results || res.data)
    } catch (e) {}
  }

  const loadDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await consumableApi.specifications.detail(id)
      form.setFieldsValue(res.data)
      if (res.data.attachments) {
        setFileList(res.data.attachments.map(a => ({
          uid: a.id,
          name: a.file_name,
          status: 'done',
          url: a.file_url
        })))
      }
    } catch (e) {
      message.error('加载详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    loadDetail()
  }, [id])

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      if (id) {
        await consumableApi.specifications.update(id, values)
        message.success('更新成功')
      } else {
        await consumableApi.specifications.create(values)
        message.success('创建成功')
      }
      for (const file of fileList.filter(f => f.originFileObj)) {
        const formData = new FormData()
        formData.append('specification', id || (await consumableApi.specifications.list({ search: values.name })).data.results[0]?.id)
        formData.append('file', file.originFileObj)
        await consumableApi.attachments.create(formData)
      }
      navigate('/consumables')
    } catch (e) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const uploadProps = {
    fileList,
    onChange: ({ fileList: newList }) => setFileList(newList),
    beforeUpload: () => false
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
          {id ? '编辑耗材规格' : '新增耗材规格'}
        </h2>
      </div>
      <Card style={{ maxWidth: 800 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'active', unit: 'box' }}>
          <Form.Item label="品类" name="category" rules={[{ required: true, message: '请选择品类' }]}>
            <Select placeholder="选择品类"
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item label="耗材名称" name="name" rules={[{ required: true, message: '请输入名称' }]} style={{ flex: 1 }}>
              <Input placeholder="请输入耗材名称" />
            </Form.Item>
            <Form.Item label="规格型号" name="specification" rules={[{ required: true, message: '请输入规格' }]} style={{ flex: 1 }}>
              <Input placeholder="请输入规格型号" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item label="品牌" name="brand" style={{ flex: 1 }}>
              <Input placeholder="请输入品牌" />
            </Form.Item>
            <Form.Item label="单位" name="unit" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={[
                { value: 'box', label: '盒' },
                { value: 'pack', label: '包' },
                { value: 'piece', label: '个' },
                { value: 'roll', label: '卷' },
                { value: 'ream', label: '令' },
                { value: 'kg', label: '千克' },
                { value: 'liter', label: '升' },
                { value: 'set', label: '套' }
              ]} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item label="单价(元)" name="unit_price" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="状态" name="status" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={[
                { value: 'active', label: '在用' },
                { value: 'inactive', label: '停用' },
                { value: 'obsolete', label: '淘汰' }
              ]} />
            </Form.Item>
          </Space>
          <Form.Item label="规格附件" name="attachments">
            <Upload {...uploadProps} multiple>
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="备注说明" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
            <Button onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ConsumableForm
