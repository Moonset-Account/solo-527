import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Select, Statistic, Table, Tag, message } from 'antd'
import ReactECharts from 'echarts-for-react'
import { contractApi, consumableApi } from '@/api/endpoints'
import dayjs from 'dayjs'

function PriceBoard() {
  const [specs, setSpecs] = useState([])
  const [currentSpec, setCurrentSpec] = useState(null)
  const [priceData, setPriceData] = useState([])
  const [contractPrices, setContractPrices] = useState([])
  const [priceHistories, setPriceHistories] = useState([])
  const [loading, setLoading] = useState(false)
  const [months, setMonths] = useState(12)

  const loadSpecs = async () => {
    try {
      const res = await consumableApi.specifications.list({ page_size: 500, status: 'active' })
      setSpecs(res.data.results || res.data)
    } catch (e) {}
  }

  const loadData = async (specId) => {
    if (!specId) return
    setLoading(true)
    try {
      const [fluctuationRes, pricesRes, historiesRes] = await Promise.all([
        contractApi.priceHistories.fluctuation({ specification: specId, months }),
        contractApi.prices.list({ specification: specId, ordering: '-effective_date' }),
        contractApi.priceHistories.list({ specification: specId, ordering: '-price_date' })
      ])
      setPriceData(fluctuationRes.data || [])
      setContractPrices(pricesRes.data.results || pricesRes.data || [])
      setPriceHistories(historiesRes.data.results || historiesRes.data || [])
    } catch (e) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSpecs()
  }, [])

  useEffect(() => {
    if (currentSpec) {
      loadData(currentSpec)
    }
  }, [currentSpec, months])

  const chartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均价格', '最低价格', '最高价格'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: priceData.map(d => dayjs(d.month).format('YYYY-MM'))
    },
    yAxis: { type: 'value', name: '价格 (元)' },
    series: [
      { name: '平均价格', type: 'line', smooth: true, data: priceData.map(d => d.avg_price), itemStyle: { color: '#1677ff' }, areaStyle: { opacity: 0.3 } },
      { name: '最低价格', type: 'line', data: priceData.map(d => d.min_price), itemStyle: { color: '#52c41a' } },
      { name: '最高价格', type: 'line', data: priceData.map(d => d.max_price), itemStyle: { color: '#fa8c16' } }
    ]
  }

  const historyColumns = [
    { title: '价格日期', dataIndex: 'price_date', key: 'price_date' },
    { title: '单价(元)', dataIndex: 'unit_price', key: 'unit_price' },
    { title: '来源', dataIndex: 'source', key: 'source', render: v => <Tag color={v === 'contract' ? 'blue' : 'default'}>{v === 'contract' ? '合同价格' : v}</Tag> },
    { title: '变动原因', dataIndex: 'change_reason', key: 'change_reason', render: v => v || '-' },
    { title: '记录人', dataIndex: 'recorded_by_name', key: 'recorded_by_name' }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">价格波动看板</h2>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Select
            showSearch
            optionFilterProp="children"
            style={{ width: '100%' }}
            placeholder="选择耗材规格"
            value={currentSpec}
            onChange={setCurrentSpec}
            options={specs.map(s => ({ value: s.id, label: `${s.name} - ${s.specification} (${s.brand || ''})` }))}
          />
        </Col>
        <Col span={4}>
          <Select value={months} onChange={setMonths} style={{ width: '100%' }}>
            <Select.Option value={6}>近6个月</Select.Option>
            <Select.Option value={12}>近12个月</Select.Option>
            <Select.Option value={24}>近24个月</Select.Option>
          </Select>
        </Col>
      </Row>

      {currentSpec && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic title="协议单价(元)" value={contractPrices[0]?.unit_price || 0} precision={2} prefix="¥" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="历史均价" value={priceData.length > 0 ? priceData[priceData.length - 1]?.avg_price : 0} precision={2} prefix="¥" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="历史最高" value={priceData.reduce((m, d) => Math.max(m, d.max_price || 0), 0).toFixed(2)} prefix="¥" valueStyle={{ color: '#fa8c16' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="历史最低" value={priceData.reduce((m, d) => Math.min(m, d.min_price || Infinity), Infinity) || 0} precision={2} prefix="¥" valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
          </Row>

          <Card title="价格趋势图" style={{ marginBottom: 16 }} loading={loading}>
            {priceData.length > 0 ? (
              <ReactECharts option={chartOption} style={{ height: 350 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
            )}
          </Card>

          <Card title="合同价格明细" style={{ marginBottom: 16 }}>
            <Table
              size="small"
              rowKey="id"
              dataSource={contractPrices}
              columns={[
                { title: '所属合同', dataIndex: 'contract_number', key: 'contract' },
                { title: '协议单价(元)', dataIndex: 'unit_price', key: 'unit_price' },
                { title: '最小采购量', dataIndex: 'minimum_quantity', key: 'minimum_quantity' },
                { title: '折扣率(%)', dataIndex: 'discount_rate', key: 'discount_rate' },
                { title: '生效日期', dataIndex: 'effective_date', key: 'effective_date' },
                { title: '失效日期', dataIndex: 'expiration_date', key: 'expiration_date', render: v => v || '-' }
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>

          <Card title="价格变动历史">
            <Table
              size="small"
              rowKey="id"
              dataSource={priceHistories}
              columns={historyColumns}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      )}

      {!currentSpec && (
        <Card>
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>请选择耗材规格查看价格波动</div>
        </Card>
      )}
    </div>
  )
}

export default PriceBoard
