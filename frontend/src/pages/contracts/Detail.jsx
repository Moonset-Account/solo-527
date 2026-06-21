import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Descriptions, Table, Tag, Card, Tabs, Space, Modal, Form, Input, Select, message, Statistic, Row, Col } from 'antd'
import { ArrowLeftOutlined, EditOutlined, AuditOutlined, RetweetOutlined } from '@ant-design/icons'
import { contractApi } from '@/api/endpoints'
import { useAuthStore } from '@/store'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'

function ContractDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [renewals, setRenewals] = useState([])
  const [priceHistories, setPriceHistories] = useState([])
  const [loading, setLoading] = useState(false)
  const [renewalModal, setRenewalModal] = useState(false)
  const [handleRenewalModal, setHandleRenewalModal] = useState(false)
  const [currentRenewal, setCurrentRenewal] = useState(null)
  const [renewalForm] = Form.useForm()
  const [handleForm] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const [contractRes, renewalsRes] = await Promise.all([
        contractApi.detail(id),
        contractApi.renewals.list({ original_contract: id, ordering: '-created_at' })
      ])
      setData(contractRes.data)
      setRenewals(renewalsRes.data.results || renewalsRes.data)

      const specIds = (contractRes.data.prices || []).map(p => p.specification)
      if (specIds.length > 0) {
        const histRes = await contractApi.priceHistories.list({
          specification: specIds[0], ordering: '-price_date', page_size: 24
        })
        setPriceHistories(histRes.data.results || histRes.data)
      }
    } catch (e) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const canEdit = ['procurement_manager', 'admin'].includes(user?.role)
  const canRenew = ['project_manager', 'admin'].includes(user?.role)

  const statusColors = { draft: 'default', pending_approval: 'processing', active: 'green', expiring_soon: 'orange', expired: 'red', terminated: 'volcano' }
  const statusLabels = { draft: '草稿', pending_approval: '待审批', active: '执行中', expiring_soon: '即将到期', expired: '已到期', terminated: '已终止' }

  const handleCreateRenewal = async (values) => {
    try {
      await contractApi.createRenewal(id, values)
      message.success('续签申请已创建')
      setRenewalModal(false)
      renewalForm.resetFields()
      loadData()
    } catch (e) {
      const err = e.response?.data?.error || '创建失败'
      message.error(err)
    }
  }

  const handleRenewalAction = async (values) => {
    if (!currentRenewal) return
    try {
      await contractApi.renewals.handle(currentRenewal.id, values)
      message.success('续签处理完成，价格已同步到看板')
      setHandleRenewalModal(false)
      handleForm.resetFields()
      setCurrentRenewal(null)
      loadData()
    } catch (e) {
      message.error('处理失败')
    }
  }

  const chartOption = priceHistories.length > 0 ? {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: priceHistories.map(h => dayjs(h.price_date).format('YYYY-MM-DD')).reverse() },
    yAxis: { type: 'value', name: '单价(元)' },
    series: [{ type: 'line', data: priceHistories.map(h => parseFloat(h.unit_price)).reverse(), smooth: true, areaStyle: { opacity: 0.3 } }]
  } : null

  if (!data) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/contracts')} />
          {data.contract_number} - {data.title}
        </h2>
        <Space>
          {canEdit && <Button icon={<EditOutlined />} onClick={() => navigate(`/contracts/${id}/edit`)}>编辑</Button>}
          {canEdit && data.status === 'draft' && (
            <Button type="primary" icon={<AuditOutlined />} onClick={async () => {
              try { await contractApi.submitForApproval(id); message.success('已提交审批'); loadData() } catch (e) { message.error('提交失败') }
            }}>提交审批</Button>
          )}
          {canRenew && ['active', 'expiring_soon'].includes(data.status) && !data.active_renewal && (
            <Button icon={<RetweetOutlined />} onClick={() => setRenewalModal(true)}>发起续签</Button>
          )}
          {canRenew && data.active_renewal && (
            <Button type="primary" icon={<RetweetOutlined />} onClick={() => {
              setCurrentRenewal(data.active_renewal)
              setHandleRenewalModal(true)
            }}>处理续签</Button>
          )}
        </Space>
      </div>

      <Tabs
        items={[
          {
            key: 'basic',
            label: '合同信息',
            children: (
              <Card>
                <Descriptions column={3} bordered size="small">
                  <Descriptions.Item label="合同编号">{data.contract_number}</Descriptions.Item>
                  <Descriptions.Item label="合同名称">{data.title}</Descriptions.Item>
                  <Descriptions.Item label="状态"><Tag color={statusColors[data.status]}>{statusLabels[data.status]}</Tag></Descriptions.Item>
                  <Descriptions.Item label="供应商">{data.supplier_name}</Descriptions.Item>
                  <Descriptions.Item label="项目负责人">{data.project_manager_name}</Descriptions.Item>
                  <Descriptions.Item label="付款方式">{data.payment_terms_display}</Descriptions.Item>
                  <Descriptions.Item label="开始日期">{data.start_date}</Descriptions.Item>
                  <Descriptions.Item label="结束日期">{data.end_date}</Descriptions.Item>
                  <Descriptions.Item label="距到期">{data.days_to_expiry != null ? <span style={{ color: data.days_to_expiry <= 30 ? '#ff4d4f' : data.days_to_expiry <= 90 ? '#faad14' : '#52c41a' }}>{data.days_to_expiry} 天</span> : '-'}</Descriptions.Item>
                  <Descriptions.Item label="合同总金额">¥{data.total_amount}</Descriptions.Item>
                  <Descriptions.Item label="最小起订金额">¥{data.minimum_order_amount}</Descriptions.Item>
                  <Descriptions.Item label="覆盖品类">{data.category_names?.join('、') || '-'}</Descriptions.Item>
                  <Descriptions.Item label="合同条款" span={3}>{data.terms_and_conditions || '-'}</Descriptions.Item>
                  <Descriptions.Item label="创建人">{data.created_by_name}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{data.created_at}</Descriptions.Item>
                </Descriptions>
              </Card>
            )
          },
          {
            key: 'prices',
            label: `合同价格 (${(data.prices || []).length})`,
            children: (
              <Card>
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={data.prices || []}
                  columns={[
                    { title: '耗材规格', key: 'spec', render: (_, r) => `${r.specification_name} - ${r.specification_spec}` },
                    { title: '协议单价(元)', dataIndex: 'unit_price', key: 'unit_price' },
                    { title: '最小采购量', dataIndex: 'minimum_quantity', key: 'minimum_quantity' },
                    { title: '折扣率(%)', dataIndex: 'discount_rate', key: 'discount_rate' },
                    { title: '生效日期', dataIndex: 'effective_date', key: 'effective_date' },
                    { title: '失效日期', dataIndex: 'expiration_date', key: 'expiration_date', render: v => v || '-' },
                    { title: '有效', dataIndex: 'is_active', key: 'is_active', render: v => v ? <Tag color="green">有效</Tag> : <Tag color="red">失效</Tag> }
                  ]}
                  pagination={false}
                />
              </Card>
            )
          },
          {
            key: 'history',
            label: '价格趋势',
            children: (
              <Card>
                {chartOption ? (
                  <ReactECharts option={chartOption} style={{ height: 300 }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无价格历史数据</div>
                )}
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={priceHistories}
                  columns={[
                    { title: '价格日期', dataIndex: 'price_date', key: 'price_date' },
                    { title: '单价(元)', dataIndex: 'unit_price', key: 'unit_price' },
                    { title: '来源', dataIndex: 'source', key: 'source', render: v => v === 'contract' ? <Tag color="blue">合同</Tag> : v },
                    { title: '变动原因', dataIndex: 'change_reason', key: 'change_reason' },
                    { title: '记录人', dataIndex: 'recorded_by_name', key: 'recorded_by_name' }
                  ]}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'renewals',
            label: `续签记录 (${renewals.length})`,
            children: (
              <Card>
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={renewals}
                  columns={[
                    { title: '原合同', dataIndex: 'original_contract_number', key: 'original' },
                    { title: '原合同到期', dataIndex: 'original_contract_end_date', key: 'end_date' },
                    { title: '新合同', dataIndex: 'new_contract_number', key: 'new', render: v => v || '-' },
                    { title: '处理结果', dataIndex: 'decision_display', key: 'decision', render: (v, r) => <Tag color={r.decision === 'renewed' ? 'green' : r.decision === 'not_renewed' ? 'red' : 'orange'}>{v}</Tag> },
                    { title: '决策原因', dataIndex: 'decision_reason', key: 'reason', render: v => v || '-' },
                    { title: '处理人', dataIndex: 'handled_by_name', key: 'handler', render: v => v || '-' },
                    { title: '处理日期', dataIndex: 'handled_date', key: 'handled_date', render: v => v || '-' },
                    {
                      title: '操作', key: 'action',
                      render: (_, r) => r.decision === 'pending' && canRenew ? (
                        <Button type="link" onClick={() => { setCurrentRenewal(r); setHandleRenewalModal(true); handleForm.setFieldsValue({ decision: 'renewed' }) }}>处理</Button>
                      ) : null
                    }
                  ]}
                  pagination={false}
                />
              </Card>
            )
          }
        ]}
      />

      <Modal title="发起续签" open={renewalModal} onCancel={() => setRenewalModal(false)} footer={null}>
        <Form form={renewalForm} layout="vertical" onFinish={handleCreateRenewal}>
          <Form.Item label="续签建议" name="renewal_recommendation">
            <Input.TextArea rows={4} placeholder="请填写续签建议，如：建议续签，价格需调整..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交续签申请</Button>
            <Button onClick={() => setRenewalModal(false)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="处理续签" open={handleRenewalModal} onCancel={() => { setHandleRenewalModal(false); setCurrentRenewal(null) }} footer={null}>
        <Form form={handleForm} layout="vertical" onFinish={handleRenewalAction}>
          <Form.Item label="处理决定" name="decision" rules={[{ required: true, message: '请选择处理决定' }]}>
            <Select options={[
              { value: 'renewed', label: '续签' },
              { value: 'not_renewed', label: '不续签' },
              { value: 'pending', label: '暂不处理' }
            ]} />
          </Form.Item>
          <Form.Item label="决策原因" name="decision_reason">
            <Input.TextArea rows={3} placeholder="请填写决策原因" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.decision !== cur.decision}>
            {({ getFieldValue }) => getFieldValue('decision') === 'renewed' ? (
              <Form.Item label="新合同ID" name="new_contract" help="如已创建新合同，请输入新合同ID">
                <Input type="number" placeholder="新合同ID（可选）" />
              </Form.Item>
            ) : null}
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确认处理</Button>
            <Button onClick={() => { setHandleRenewalModal(false); setCurrentRenewal(null) }} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ContractDetail
