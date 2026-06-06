import { Card, Form, Input, Select, Button, InputNumber, message, Steps, Table, Tag, Modal } from 'antd'
import { SearchOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { pickupApi } from '@/services/pickup'
import { childApi } from '@/services/children'
import { useAuthStore } from '@/store/auth'
import type { PickupRecord, Child, AuthorizedPerson } from '@/types'
import dayjs from 'dayjs'

const { Step } = Steps

const PickupVerify = () => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [step, setStep] = React.useState(0)
  const [searchResult, setSearchResult] = React.useState<Child | null>(null)
  const [authorizedPersons, setAuthorizedPersons] = React.useState<AuthorizedPerson[]>([])
  const [selectedPerson, setSelectedPerson] = React.useState<AuthorizedPerson | null>(null)
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null)
  const [pendingRecords, setPendingRecords] = React.useState<PickupRecord[]>([])

  const { data: children } = useQuery(
    ['children-for-pickup'],
    () => childApi.getList({ status: 'active' }).then((res) => res.data.results)
  )

  React.useEffect(() => {
    pickupApi.getRecords({ status: 'pending', ordering: '-created_at' })
      .then((res) => setPendingRecords(res.data.results))
  }, [])

  const checkAuthorized = async (values: any) => {
    try {
      const res = await pickupApi.checkAuthorized({
        child_id: values.child_id,
        phone: values.phone,
        name: values.name
      })
      setIsAuthorized(res.data.authorized)
      if (res.data.authorized) {
        const child = children?.find((c: Child) => c.id === values.child_id)
        setSearchResult(child || null)
        const persons = await childApi.getAuthorizedPersons(values.child_id)
        setAuthorizedPersons(persons.data)
        setStep(1)
      } else {
        message.warning(res.data.reason || '未找到授权接送人')
        Modal.confirm({
          title: '非授权人员',
          content: `该人员未在授权列表中，是否继续登记？原因：${res.data.reason || '未找到'}`,
          okText: '继续登记',
          cancelText: '取消',
          onOk: () => {
            setIsAuthorized(false)
            const child = children?.find((c: Child) => c.id === values.child_id)
            setSearchResult(child || null)
            setStep(1)
          }
        })
      }
    } catch (error) {
      message.error('核验失败')
    }
  }

  const verifyMutation = useMutation(
    (data: { id: number; status: string; reject_reason?: string; temperature?: number }) =>
      pickupApi.verifyRecord(data.id, data),
    {
      onSuccess: () => {
        message.success('核验完成')
        queryClient.invalidateQueries(['pickup-records'])
        setStep(0)
        form.resetFields()
        setSearchResult(null)
        setIsAuthorized(null)
        pickupApi.getRecords({ status: 'pending', ordering: '-created_at' })
          .then((res) => setPendingRecords(res.data.results))
      }
    }
  )

  const createRecordMutation = useMutation(
    (data: any) => pickupApi.createRecord(data),
    {
      onSuccess: (res) => {
        message.success('登记成功')
        setStep(2)
        pickupApi.getRecords({ status: 'pending', ordering: '-created_at' })
          .then((res) => setPendingRecords(res.data.results))
      }
    }
  )

  const onSubmitRecord = (values: any) => {
    const data = {
      child: searchResult?.id,
      pickup_type: values.pickup_type,
      pickup_person_name: values.name,
      pickup_person_phone: values.phone,
      pickup_person_relation: values.relation,
      authorized_person: selectedPerson?.id || null,
      notes: values.notes
    }
    createRecordMutation.mutate(data)
  }

  const handleVerify = (record: PickupRecord, status: 'verified' | 'rejected', reason?: string) => {
    verifyMutation.mutate({
      id: record.id,
      status,
      reject_reason: reason
    })
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">接送核验</h2>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false}>
            <Steps current={step} style={{ marginBottom: 24 }}>
              <Step title="信息核验" />
              <Step title="登记信息" />
              <Step title="完成" />
            </Steps>

            {step === 0 && (
              <Form form={form} layout="vertical" onFinish={checkAuthorized}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="选择儿童"
                      name="child_id"
                      rules={[{ required: true, message: '请选择儿童' }]}
                    >
                      <Select
                        showSearch
                        placeholder="搜索或选择儿童"
                        optionFilterProp="children"
                        options={children?.map((c: Child) => ({
                          label: `${c.name} (${c.class_name})`,
                          value: c.id
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="接送人手机号"
                      name="phone"
                      rules={[{ required: true, message: '请输入手机号' }]}
                    >
                      <Input placeholder="请输入接送人手机号" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="接送人姓名" name="name">
                  <Input placeholder="请输入接送人姓名（选填）" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                    核验授权
                  </Button>
                </Form.Item>
              </Form>
            )}

            {step === 1 && searchResult && (
              <Form layout="vertical" onFinish={onSubmitRecord} initialValues={{
                name: form.getFieldValue('name'),
                phone: form.getFieldValue('phone')
              }}>
                <Card type="inner" title="儿童信息" size="small" style={{ marginBottom: 16 }}>
                  <p>姓名：<strong>{searchResult.name}</strong></p>
                  <p>班级：{searchResult.class_name}</p>
                  <p>
                    授权状态：
                    {isAuthorized ? (
                      <Tag color="green">已授权</Tag>
                    ) : isAuthorized === false ? (
                      <Tag color="red">未授权</Tag>
                    ) : null}
                  </p>
                </Card>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="接送类型"
                      name="pickup_type"
                      rules={[{ required: true }]}
                      initialValue="pickup"
                    >
                      <Select>
                        <Select.Option value="dropoff">入园</Select.Option>
                        <Select.Option value="pickup">离园</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="与儿童关系"
                      name="relation"
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Select.Option value="父亲">父亲</Select.Option>
                        <Select.Option value="母亲">母亲</Select.Option>
                        <Select.Option value="祖父">祖父</Select.Option>
                        <Select.Option value="祖母">祖母</Select.Option>
                        <Select.Option value="外祖父">外祖父</Select.Option>
                        <Select.Option value="外祖母">外祖母</Select.Option>
                        <Select.Option value="其他">其他</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="接送人姓名" name="name" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="接送人电话" name="phone" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                {authorizedPersons.length > 0 && (
                  <Card type="inner" title="授权接送人列表" size="small" style={{ marginBottom: 16 }}>
                    {authorizedPersons.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: '8px 12px',
                          border: selectedPerson?.id === p.id ? '2px solid #1890ff' : '1px solid #e8e8e8',
                          borderRadius: 6,
                          marginBottom: 8,
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedPerson(p)}
                      >
                        {p.name} - {p.relation} - {p.phone}
                      </div>
                    ))}
                  </Card>
                )}

                <Form.Item label="体温" name="temperature">
                  <InputNumber min={35} max={42} step={0.1} placeholder="选填" />
                </Form.Item>

                <Form.Item label="备注" name="notes">
                  <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item>
                  <Button onClick={() => setStep(0)} style={{ marginRight: 8 }}>
                    返回
                  </Button>
                  <Button type="primary" htmlType="submit" loading={createRecordMutation.isLoading}>
                    提交登记
                  </Button>
                </Form.Item>
              </Form>
            )}

            {step === 2 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <h3 style={{ marginTop: 16 }}>登记完成</h3>
                <p style={{ color: '#8c8c8c' }}>请等待老师核验</p>
                <Button type="primary" onClick={() => setStep(0)} style={{ marginTop: 16 }}>
                  继续登记
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="待核验列表" bordered={false}>
            <Table
              dataSource={pendingRecords}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 500 }}
              columns={[
                { title: '儿童', dataIndex: 'child_name' },
                { title: '类型', dataIndex: 'pickup_type_display', width: 80 },
                { title: '接送人', dataIndex: 'pickup_person_name', width: 100 },
                {
                  title: '操作',
                  width: 120,
                  render: (_, record) => (
                    <>
                      <Button
                        type="text"
                        icon={<CheckOutlined />}
                        size="small"
                        style={{ color: '#52c41a' }}
                        onClick={() => handleVerify(record, 'verified')}
                      >
                        通过
                      </Button>
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        size="small"
                        danger
                        onClick={() => {
                          Modal.confirm({
                            title: '拒绝',
                            content: '请输入拒绝原因',
                            okText: '确认',
                            onOk: () => {
                              handleVerify(record, 'rejected', '非授权人员')
                            }
                          })
                        }}
                      >
                        拒绝
                      </Button>
                    </>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default PickupVerify
