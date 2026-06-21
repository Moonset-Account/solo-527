import React, { useEffect, useState } from 'react'
import { Form, Input, Select, InputNumber, Button, DatePicker, Card, Row, Col, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { supplierApi } from '@/api/endpoints'
import dayjs from 'dayjs'

function SupplierForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const loadDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await supplierApi.detail(id)
      form.setFieldsValue({
        ...res.data,
        establishment_date: res.data.establishment_date ? dayjs(res.data.establishment_date) : null
      })
    } catch (e) {
      message.error('加载详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
  }, [id])

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const cleaned = {
        ...values,
        establishment_date: values.establishment_date?.format('YYYY-MM-DD')
      }
      if (id) {
        await supplierApi.update(id, cleaned)
        message.success('更新成功')
      } else {
        await supplierApi.create(cleaned)
        message.success('创建成功')
      }
      navigate('/suppliers')
    } catch (e) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
          {id ? '编辑供应商' : '新增供应商'}
        </h2>
      </div>
      <Card style={{ maxWidth: 1000 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'potential' }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="供应商名称" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="统一社会信用代码" name="unified_social_credit_code" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="法人代表" name="legal_person">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="成立日期" name="establishment_date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="注册资本(万元)" name="registered_capital">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="联系人" name="contact_person" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="联系电话" name="contact_phone" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="联系邮箱" name="contact_email">
                <Input type="email" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="地址" name="address">
            <Input />
          </Form.Item>
          <Form.Item label="经营范围" name="business_scope">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="合作状态" name="status" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'active', label: '合作中' },
                  { value: 'suspended', label: '暂停' },
                  { value: 'blacklisted', label: '黑名单' },
                  { value: 'potential', label: '潜在' }
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="信用评级" name="credit_rating">
                <Select options={[
                  { value: 'aaa', label: 'AAA 优秀' },
                  { value: 'aa', label: 'AA 良好' },
                  { value: 'a', label: 'A 一般' },
                  { value: 'b', label: 'B 合格' },
                  { value: 'c', label: 'C 风险' },
                  { value: 'd', label: 'D 不合格' }
                ]} allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="纳税人识别号" name="tax_number">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="开户银行" name="bank_name">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="银行账户" name="bank_account">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
            <Button onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default SupplierForm
