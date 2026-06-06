import { Card, Form, Select, DatePicker, InputNumber, Button, Input, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import { paymentApi } from '@/services/index'
import { childApi } from '@/services/children'

const { TextArea } = Input

const PaymentCreate = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()

  const { data: children } = useQuery(
    ['all-children'],
    () => childApi.getList({ status: 'active' }).then((res) => res.data.results)
  )

  const { data: items } = useQuery(
    ['payment-items-active'],
    () => paymentApi.getItems({ is_active: true }).then((res) => res.data.results)
  )

  const createMutation = useMutation(
    (data: any) => paymentApi.createInvoice(data),
    {
      onSuccess: () => {
        message.success('创建成功')
        queryClient.invalidateQueries(['invoices'])
        navigate('/payments')
      }
    }
  )

  const onFinish = (values: any) => {
    const data = {
      child: values.child,
      item: values.item,
      amount: values.amount,
      bill_date: values.bill_date.format('YYYY-MM-DD'),
      due_date: values.due_date.format('YYYY-MM-DD'),
      notes: values.notes
    }
    createMutation.mutate(data)
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginRight: 12 }} />
          创建缴费账单
        </h2>
      </div>

      <Card bordered={false} style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="选择儿童"
            name="child"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              placeholder="选择儿童"
              optionFilterProp="children"
              options={children?.map((c: any) => ({
                label: `${c.name} (${c.class_name})`,
                value: c.id
              }))}
            />
          </Form.Item>

          <Form.Item
            label="收费项目"
            name="item"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="选择收费项目"
              options={items?.map((item: any) => ({
                label: `${item.name} (¥${item.default_amount})`,
                value: item.id
              }))}
              onChange={(val) => {
                const item = items?.find((i: any) => i.id === val)
                if (item) form.setFieldsValue({ amount: item.default_amount })
              }}
            />
          </Form.Item>

          <Form.Item
            label="金额"
            name="amount"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" />
          </Form.Item>

          <Form.Item
            label="账单日期"
            name="bill_date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="到期日期"
            name="due_date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="备注" name="notes">
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isLoading}>
              创建
            </Button>
            <Button onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default PaymentCreate
